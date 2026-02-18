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

                    const qrPayload = JSON.stringify({
                        orderId: data.id,
                        orderNumber: data.orderNumber,
                        action: "deliver",
                    });
                    const dataUrl = await QRCode.toDataURL(qrPayload, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: "#102216",
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
            color: "text-primary",
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
            <div className="flex flex-col items-center justify-center min-h-dvh bg-background-light">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">
                    progress_activity
                </span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-background-light px-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 mb-4">
                    <span className="material-symbols-outlined text-gray-300 text-[40px]">error_outline</span>
                </div>
                <p className="text-lg font-bold text-text-main">Pedido no encontrado</p>
                <button
                    onClick={() => router.push("/orders")}
                    className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-background-dark shadow-soft active:scale-95 transition-all"
                >
                    Volver a pedidos
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-dvh bg-background-light px-6 py-10">
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
            <p className="text-xs text-text-secondary font-medium tracking-wider uppercase mb-1">Pedido</p>
            <h1 className="text-2xl font-extrabold text-text-main mb-6">
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
                    className={`rounded-3xl bg-white p-6 shadow-elevated border-2 ${order.status === "ready"
                        ? "border-primary animate-pulse-glow"
                        : "border-gray-100"
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
                    <div className="h-24 w-24 rounded-3xl bg-primary/15 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary filled text-[48px]">
                            check_circle
                        </span>
                    </div>
                    <p className="text-lg font-bold text-text-main">
                        ¡Pedido entregado!
                    </p>
                </div>
            )}

            {/* Order summary */}
            <div className="w-full max-w-md mt-8 rounded-2xl bg-white border border-gray-100/80 p-4 shadow-sm gradient-border">
                <h3 className="text-sm font-bold text-text-main mb-3">
                    Resumen del pedido
                </h3>
                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                            <p className="text-sm font-medium text-text-main">{item.name}</p>
                            <p className="text-xs text-text-secondary">{item.qty}</p>
                        </div>
                        <p className="text-sm font-bold text-text-main tabular-nums">
                            {parseFloat(item.subtotal || item.unitPrice || "0").toFixed(2)} €
                        </p>
                    </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                    <p className="text-sm font-bold text-text-main">Total</p>
                    <p className="text-lg font-extrabold text-primary-dark">
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
