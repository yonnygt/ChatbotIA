"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

type ScanStatus = "idle" | "requesting" | "scanning" | "processing" | "success" | "error" | "no-camera";

export default function StaffScanPage() {
    const router = useRouter();
    const [status, setStatus] = useState<ScanStatus>("idle");
    const [scanResult, setScanResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);

    const scanLockRef = useRef<number>(0);

    const stopScanner = useCallback(async () => {
        // invalidates any pending startScanner calls
        scanLockRef.current = 0;

        const scanner = scannerRef.current;
        if (scanner) {
            try {
                const state = scanner.getState();
                // State 2 = SCANNING, State 3 = PAUSED
                if (state === 2 || state === 3) {
                    await scanner.stop();
                }
                scanner.clear(); // Ensure DOM is cleared
            } catch (err) {
                console.warn("Error stopping scanner:", err);
            }
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        // Generate a unique ID for this attempt
        const myId = Date.now();
        scanLockRef.current = myId;

        setStatus("requesting");
        setErrorMsg("");

        // First check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus("no-camera");
            setErrorMsg("Tu navegador no soporta acceso a la cámara. Usa Chrome o Safari.");
            return;
        }

        // Wait a bit for the DOM to settle (since we changed status to "requesting" which reveals the div)
        await new Promise(r => setTimeout(r, 100));

        // RACE CONDITION CHECK: 
        // If scanLockRef has changed (new start called or stopped), or unmounted, abort.
        if (scanLockRef.current !== myId || !mountedRef.current) return;

        // Explicitly request camera permission first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            // We got permission, stop the stream (Html5Qrcode will create its own)
            stream.getTracks().forEach((t) => t.stop());
        } catch (err: any) {
            // Check lock again after async await
            if (scanLockRef.current !== myId || !mountedRef.current) return;

            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setStatus("no-camera");
                setErrorMsg("Permiso de cámara denegado. Habilita el acceso en la configuración de tu navegador.");
            } else if (err.name === "NotFoundError") {
                setStatus("no-camera");
                setErrorMsg("No se encontró ninguna cámara en este dispositivo.");
            } else {
                setStatus("error");
                setErrorMsg(`Error al acceder a la cámara: ${err.message || err.name}`);
            }
            return;
        }

        // Check lock again
        if (scanLockRef.current !== myId || !mountedRef.current) return;

        // Ensure previous scanner is stopped/cleared if it exists (defensive)
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch { }
            scannerRef.current = null;
        }

        // Now start the QR scanner
        try {
            const scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                async (decodedText) => {
                    // QR code scanned successfully
                    try {
                        const payload = JSON.parse(decodedText);

                        if (!payload.orderId || payload.action !== "deliver") {
                            await stopScanner();
                            if (mountedRef.current) {
                                setStatus("error");
                                setErrorMsg("Código QR no válido para entrega");
                            }
                            return;
                        }

                        await stopScanner();
                        if (!mountedRef.current) return;

                        setStatus("processing");

                        // Call API to mark as delivered
                        const res = await fetch("/api/orders", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: payload.orderId,
                                status: "completed",
                            }),
                        });

                        if (!mountedRef.current) return;

                        if (res.ok) {
                            setScanResult(payload);
                            setStatus("success");
                        } else {
                            setStatus("error");
                            setErrorMsg("No se pudo actualizar el pedido");
                        }
                    } catch {
                        await stopScanner();
                        if (mountedRef.current) {
                            setStatus("error");
                            setErrorMsg("Código QR no reconocido");
                        }
                    }
                },
                () => {
                    // Scan frame error (no QR found), ignore
                }
            );

            // Check lock again - if we were cancelled *during* start
            if (scanLockRef.current !== myId) {
                console.log("Scanner started but lock changed, stopping immediately.");
                await stopScanner();
                return;
            }

            if (mountedRef.current) {
                setStatus("scanning");
            }
        } catch (err: any) {
            // Ignore AbortError or errors when unmounted (benign cleanup race conditions)
            if (err.name === "AbortError" || !mountedRef.current || scanLockRef.current !== myId) {
                return;
            }
            setStatus("error");
            setErrorMsg(`Error al iniciar el escáner: ${err.message || "desconocido"}`);
        }
    }, [stopScanner]);

    useEffect(() => {
        // Suppress benign "AbortError" from Html5Qrcode's internal video.play()
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.name === "AbortError" && event.reason?.message?.includes("play()")) {
                event.preventDefault();
            }
        };
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        mountedRef.current = true;
        startScanner();

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
            mountedRef.current = false;
            stopScanner();
        };
    }, [startScanner, stopScanner]);

    const handleRetry = async () => {
        await stopScanner();
        setScanResult(null);
        setErrorMsg("");
        setStatus("idle");
        // Small delay to let the DOM re-render the #qr-reader div
        setTimeout(() => {
            startScanner();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <header className="p-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <span className="font-bold">Escanear Código</span>
                <div className="w-6" />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative">

                {/* Single stable container for the scanner. 
                    Must be "block" (not hidden) for Html5Qrcode to attach video correctly in some browsers.
                    We use opacity/absolute positioning if we needed to hide it, but here we just keep it in flow 
                    and overlay the loading state if needed. 
                */}
                <div className={`relative w-full max-w-sm ${status === "idle" ? "hidden" : "block"}`}>
                    <div className="absolute inset-0 z-10 pointer-events-none rounded-xl border-2 border-primary/50" />
                    <div id="qr-reader" className="w-full overflow-hidden rounded-xl" />
                </div>

                {status === "scanning" && (
                    <p className="mt-8 text-center text-gray-400 text-sm max-w-xs">
                        Apunta la cámara al código QR del cliente para confirmar la entrega.
                    </p>
                )}

                {/* Loading / Requesting / Processing states */}
                {(status === "idle" || status === "requesting" || status === "processing") && (
                    <div className="text-center absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
                            progress_activity
                        </span>
                        <p className="text-gray-400">
                            {status === "processing" ? "Procesando entrega..." : "Iniciando cámara..."}
                        </p>
                    </div>
                )}


                {/* Success State */}
                {status === "success" && (
                    <div className="text-center z-20 bg-black/90 p-8 rounded-2xl">
                        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary filled text-[48px]">
                                check_circle
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            ¡Entrega confirmada!
                        </h2>
                        <p className="text-gray-400 mt-1">
                            Pedido #{scanResult?.orderNumber?.slice(-6) || scanResult?.orderId}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Marcado como entregado
                        </p>
                        <div className="flex gap-3 mt-8 justify-center">
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 rounded-full bg-surface-highlight px-5 py-3 text-sm font-bold text-white hover:brightness-110 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                                Escanear otro
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-text-main hover:brightness-110 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                                Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* No Camera / Error State */}
                {(status === "no-camera" || status === "error") && (
                    <div className="text-center z-20 bg-black p-4">
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 ${status === 'no-camera' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                            <span className={`material-symbols-outlined filled text-[48px] ${status === 'no-camera' ? 'text-yellow-400' : 'text-red-400'}`}>
                                {status === "no-camera" ? "videocam_off" : "error"}
                            </span>
                        </div>
                        <h2 className={`text-xl font-bold mb-2 ${status === 'no-camera' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {status === "no-camera" ? "Cámara no disponible" : "Error"}
                        </h2>
                        <p className="text-gray-400 max-w-xs mx-auto">{errorMsg}</p>

                        <div className="flex flex-col gap-3 mt-8 items-center">
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-text-main hover:brightness-110 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                {status === "no-camera" ? "Reintentar" : "Intentar de nuevo"}
                            </button>
                            {status === "no-camera" && (
                                <p className="text-xs text-gray-600 max-w-[250px] text-center mt-2">
                                    En Chrome: toca el icono 🔒 en la barra de dirección → Permisos del sitio → Cámara → Permitir
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
