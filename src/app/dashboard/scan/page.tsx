"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

type ScanState = "idle" | "requesting" | "scanning" | "processing" | "success" | "error" | "no-camera";

export default function StaffScanPage() {
    const router = useRouter();
    const [state, setState] = useState<ScanState>("idle");
    const [message, setMessage] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const scannerRef = useRef<any>(null);
    const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null);

    // Load the library on mount
    useEffect(() => {
        import("html5-qrcode").then((mod) => {
            setHtml5Qrcode(() => mod.Html5Qrcode);
        }).catch((err) => {
            console.error("Failed to load html5-qrcode:", err);
            setState("no-camera");
            setMessage("No se pudo cargar la librería del escáner.");
        });
    }, []);

    const handleScanSuccess = useCallback(async (decodedText: string) => {
        setState("processing");

        // Stop scanning immediately
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch { }
        }

        try {
            const payload = JSON.parse(decodedText);
            if (!payload.orderId || payload.action !== "deliver") {
                setState("error");
                setMessage("QR inválido. No es un código de pedido.");
                return;
            }

            const res = await fetch(`/api/orders/${payload.orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" }),
            });

            if (res.ok) {
                setState("success");
                setOrderNumber(payload.orderNumber || String(payload.orderId).slice(-6));
                setMessage("¡Pedido entregado exitosamente!");
            } else {
                setState("error");
                setMessage("Error al actualizar el pedido.");
            }
        } catch {
            setState("error");
            setMessage("Error al procesar el QR.");
        }
    }, []);

    const startScanning = useCallback(() => {
        if (!Html5Qrcode) return;
        setState("requesting");
    }, [Html5Qrcode]);

    // Initialize scanner AFTER the DOM renders the qr-reader div
    useEffect(() => {
        if (state !== "requesting" || !Html5Qrcode) return;

        let cancelled = false;

        const initScanner = async () => {
            try {
                // Clean up any previous scanner
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.stop();
                    } catch { }
                    scannerRef.current = null;
                }

                const scanner = new Html5Qrcode("qr-reader");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText: string) => {
                        handleScanSuccess(decodedText);
                    },
                    () => {
                        // QR scan failure callback (not detected yet — this is normal)
                    }
                );

                if (!cancelled) {
                    setState("scanning");
                }
            } catch (err: any) {
                if (cancelled) return;
                console.error("Camera error:", err);
                setState("no-camera");
                if (err?.name === "NotAllowedError") {
                    setMessage("Permiso de cámara denegado. Habilita el acceso a la cámara en los ajustes del navegador.");
                } else if (err?.name === "NotFoundError") {
                    setMessage("No se encontró una cámara. Asegúrate de que tu dispositivo tiene una cámara disponible.");
                } else {
                    setMessage("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
                }
            }
        };

        // Small delay to ensure DOM is fully painted
        const timer = setTimeout(initScanner, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [state, Html5Qrcode, handleScanSuccess]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const handleRetry = () => {
        setState("idle");
        setMessage("");
        setOrderNumber("");
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background-dark text-white">
            {/* Header */}
            <header className="px-5 pt-12 pb-4">
                <p className="text-xs font-medium text-primary/70 uppercase tracking-wider">Verificación</p>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Escanear QR</h1>
                <p className="text-sm text-text-light/40 mt-1">Escanea el QR del cliente para entregar</p>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-5 pb-28">
                {/* Idle */}
                {state === "idle" && (
                    <div className="text-center w-full max-w-sm">
                        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 mx-auto mb-6 border border-primary/15">
                            <span className="material-symbols-outlined text-primary text-[56px]">qr_code_scanner</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Listo para escanear</h2>
                        <p className="text-sm text-text-light/50 mb-8 leading-relaxed">
                            Presiona el botón para activar la cámara y escanear el código QR del cliente.
                        </p>
                        <button
                            onClick={startScanning}
                            disabled={!Html5Qrcode}
                            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-primary py-4 text-base font-bold text-background-dark shadow-glow hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                            {Html5Qrcode ? "Iniciar Cámara" : "Cargando..."}
                        </button>
                    </div>
                )}

                {/* Requesting / Scanning */}
                {(state === "requesting" || state === "scanning") && (
                    <div className="w-full max-w-sm">
                        <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10">
                            <div id="qr-reader" className="w-full" style={{ minHeight: "300px" }} />
                            {state === "requesting" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                                    <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
                                    <p className="text-sm text-text-light/60">Iniciando cámara...</p>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-text-light/50 mt-4">
                            Apunta la cámara al código QR del cliente
                        </p>
                        <button
                            onClick={async () => {
                                if (scannerRef.current) {
                                    try { await scannerRef.current.stop(); } catch { }
                                    scannerRef.current = null;
                                }
                                handleRetry();
                            }}
                            className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-surface-dark border border-white/10 py-3 text-sm font-bold text-text-light/70 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            Cancelar
                        </button>
                    </div>
                )}

                {/* Processing */}
                {state === "processing" && (
                    <div className="text-center">
                        <span className="material-symbols-outlined text-primary text-[56px] animate-spin">progress_activity</span>
                        <p className="text-lg font-bold text-white mt-4">Verificando pedido...</p>
                    </div>
                )}

                {/* Success */}
                {state === "success" && (
                    <div className="text-center w-full max-w-sm">
                        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/15 mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary filled text-[48px]">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">¡Entregado!</h2>
                        <p className="text-sm text-text-light/50 mb-1">{message}</p>
                        {orderNumber && (
                            <p className="text-lg font-extrabold text-primary tabular-nums mb-8">#{orderNumber}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-background-dark shadow-soft transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                                Escanear otro
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-surface-dark border border-white/5 py-3.5 text-sm font-bold text-text-light transition-all active:scale-95"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {(state === "error" || state === "no-camera") && (
                    <div className="text-center w-full max-w-sm">
                        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-400 text-[48px]">
                                {state === "no-camera" ? "videocam_off" : "error_outline"}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            {state === "no-camera" ? "Sin acceso a cámara" : "Error"}
                        </h2>
                        <p className="text-sm text-text-light/50 mb-8">{message}</p>
                        <button
                            onClick={handleRetry}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-background-dark shadow-soft transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Reintentar
                        </button>
                    </div>
                )}
            </main>

            <NavBar variant="staff" />
        </div>
    );
}
