"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
import OrderCard from "@/components/OrderCard";
import ToastNotification from "@/components/ToastNotification";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"active" | "history">("active");
    const [previousStatuses, setPreviousStatuses] = useState<Record<string, string>>({});

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data = await res.json();
                const newOrders: Order[] = data.orders || [];

                // Check for status changes and notify
                newOrders.forEach((order) => {
                    const prevStatus = previousStatuses[order.id];
                    if (prevStatus && prevStatus !== order.status) {
                        if (order.status === "preparing" && typeof window !== "undefined" && (window as any).__addToast) {
                            (window as any).__addToast(`Pedido ${order.orderNumber} en preparación 🔪`, "info");
                        }
                        if (order.status === "ready" && typeof window !== "undefined" && (window as any).__addToast) {
                            (window as any).__addToast(`¡Pedido ${order.orderNumber} listo! 🎉`, "success");
                        }
                    }
                });

                setPreviousStatuses(Object.fromEntries(newOrders.map((o) => [o.id, o.status])));
                setOrders(newOrders);
            }
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    }, [previousStatuses]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const activeOrders = orders.filter((o) => o.status !== "completed");
    const historyOrders = orders.filter((o) => o.status === "completed");
    const readyOrders = activeOrders.filter((o) => o.status === "ready");

    return (
        <div className="flex flex-col min-h-dvh bg-background-light">
            <ToastNotification />

            {/* Header */}
            <header className="px-5 pt-12 pb-4">
                <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Mis Pedidos</h1>
                <p className="text-sm text-text-secondary mt-1">Sigue el estado de tus pedidos</p>
            </header>

            {/* Ready banner */}
            {readyOrders.length > 0 && (
                <div className="mx-5 mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-background-dark via-surface-dark to-background-dark p-4 border border-primary/15">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                            <span className="material-symbols-outlined text-primary text-[26px] filled">check_circle</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">
                                {readyOrders.length} pedido{readyOrders.length > 1 ? "s" : ""} listo{readyOrders.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-text-light/50 mt-0.5">Recoge en mostrador con tu QR</p>
                        </div>
                        <a
                            href={`/orders/${readyOrders[0].id}/qr`}
                            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-background-dark shadow-soft active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[16px]">qr_code</span>
                            Ver QR
                        </a>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="px-5 mb-3">
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100/80">
                    <button
                        onClick={() => setTab("active")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${tab === "active"
                            ? "bg-white text-text-main shadow-sm"
                            : "text-text-secondary hover:text-text-main"
                            }`}
                    >
                        Activos
                        {activeOrders.length > 0 && (
                            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary-dark">
                                {activeOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${tab === "history"
                            ? "bg-white text-text-main shadow-sm"
                            : "text-text-secondary hover:text-text-main"
                            }`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Orders list */}
            <main className="flex-1 px-5 pb-28 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-36 rounded-2xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : tab === "active" ? (
                    activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/8 mb-4">
                                <span className="material-symbols-outlined text-primary/40 text-[40px]">receipt_long</span>
                            </div>
                            <p className="text-base font-bold text-text-main">Sin pedidos activos</p>
                            <p className="text-sm text-text-secondary mt-1">Tus pedidos aparecerán aquí</p>
                        </div>
                    ) : (
                        activeOrders.map((order) => (
                            <OrderCard key={order.id} order={order} variant="customer" />
                        ))
                    )
                ) : historyOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 mb-4">
                            <span className="material-symbols-outlined text-gray-300 text-[40px]">history</span>
                        </div>
                        <p className="text-base font-bold text-text-main">Sin historial</p>
                        <p className="text-sm text-text-secondary mt-1">Los pedidos completados aparecerán aquí</p>
                    </div>
                ) : (
                    historyOrders.map((order) => (
                        <OrderCard key={order.id} order={order} variant="customer" />
                    ))
                )}
            </main>

            <NavBar variant="customer" />
        </div>
    );
}
