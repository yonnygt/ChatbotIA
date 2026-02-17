"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function OrderQRPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [delivered, setDelivered] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            try {
                const res = await fetch(`/api/orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);

                    if (data.status === "completed") {
                        setDelivered(true);
                    }

                    // Generate QR code with order verification data
                    const qrPayload = JSON.stringify({
                        orderId: data.id,
                        orderNumber: data.orderNumber,
                        action: "deliver",
                    });
                    const dataUrl = await QRCode.toDataURL(qrPayload, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: "#1a2e1a",
                            light: "#ffffff",
                        },
                    });
                    setQrDataUrl(dataUrl);
                }
            } catch (error) {
                console.error("Error loading order:", error);
            } finally {
                setLoading(false);
            }
        }
        loadOrder();

        // Poll for status updates
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                    if (data.status === "completed") {
                        setDelivered(true);
                    }
                }
            } catch { }
        }, 5000);

        return () => clearInterval(interval);
    }, [id]);

    const statusInfo: Record<string, { label: string; icon: string; color: string; desc: string }> = {
        pending: {
            label: "Pendiente",
            icon: "schedule",
            color: "text-amber-500",
            desc: "Tu pedido está esperando ser atendido",
        },
        preparing: {
            label: "En preparación",
            icon: "skillet",
            color: "text-blue-500",
            desc: "Tu pedido se está preparando ahora 🔪",
        },
        ready: {
            label: "¡Listo para recoger!",
            icon: "check_circle",
            color: "text-emerald-500",
            desc: "Muestra este QR en el mostrador",
        },
        completed: {
            label: "Entregado ✅",
            icon: "verified",
            color: "text-primary",
            desc: "¡Gracias por tu compra!",
        },
    };

    const info = statusInfo[order?.status] || statusInfo.pending;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined text-gray-400 text-[48px] animate-spin">
                    progress_activity
                </span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-background-light dark:bg-background-dark px-6">
                <span className="material-symbols-outlined text-gray-400 text-[64px] mb-4">
                    error_outline
                </span>
                <p className="text-lg font-bold text-gray-500">Pedido no encontrado</p>
                <button
                    onClick={() => router.push("/orders")}
                    className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-text-main"
                >
                    Volver a pedidos
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-dvh bg-background-light dark:bg-background-dark px-6 py-10">
            {/* Back button */}
            <div className="w-full max-w-md mb-6">
                <button
                    onClick={() => router.push("/orders")}
                    className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Mis Pedidos
                </button>
            </div>

            {/* Order number */}
            <p className="text-xs text-text-secondary font-medium tracking-wider uppercase mb-1">
                Pedido
            </p>
            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-6">
                #{order.orderNumber?.slice(-6)}
            </h1>

            {/* Status badge */}
            <div className={`flex items-center gap-2 mb-6 ${info.color}`}>
                <span className="material-symbols-outlined text-[24px] filled">{info.icon}</span>
                <span className="text-lg font-bold">{info.label}</span>
            </div>
            <p className="text-sm text-text-secondary text-center mb-8">{info.desc}</p>

            {/* QR Code */}
            {!delivered && qrDataUrl && (
                <div
                    className={`rounded-3xl bg-white p-6 shadow-lg border-2 ${order.status === "ready"
                            ? "border-primary animate-pulse-glow"
                            : "border-gray-200"
                        }`}
                >
                    <img
                        src={qrDataUrl}
                        alt="QR del pedido"
                        className="w-64 h-64"
                    />
                </div>
            )}

            {/* Delivered state */}
            {delivered && (
                <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary filled text-[48px]">
                            check_circle
                        </span>
                    </div>
                    <p className="text-lg font-bold text-text-main dark:text-white">
                        ¡Pedido entregado!
                    </p>
                </div>
            )}

            {/* Order summary */}
            <div className="w-full max-w-md mt-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-700/50 p-4">
                <h3 className="text-sm font-bold text-text-main dark:text-white mb-3">
                    Resumen del pedido
                </h3>
                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/30 last:border-0">
                        <div>
                            <p className="text-sm font-medium text-text-main dark:text-white">
                                {item.name}
                            </p>
                            <p className="text-xs text-text-secondary">{item.qty}</p>
                        </div>
                        <p className="text-sm font-bold text-text-main dark:text-white">
                            {parseFloat(item.subtotal || item.unitPrice || "0").toFixed(2)} €
                        </p>
                    </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-bold text-text-main dark:text-white">Total</p>
                    <p className="text-lg font-bold text-primary-dark dark:text-primary">
                        {parseFloat(order.totalAmount || "0").toFixed(2)} €
                    </p>
                </div>
            </div>

            {/* Estimated time */}
            {!delivered && order.estimatedMinutes && (
                <div className="flex items-center gap-2 mt-4 text-text-secondary">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <p className="text-xs">Tiempo estimado: ~{order.estimatedMinutes} min</p>
                </div>
            )}
        </div>
    );
}
