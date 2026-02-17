"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import OrderCard from "@/components/OrderCard";
import ToastNotification, { showToast } from "@/components/ToastNotification";
import type { Order } from "@/lib/types";

const tabs = [
    { label: "Activos", filter: ["pending", "preparing", "ready"] },
    { label: "Historial", filter: ["completed"] },
];

export default function OrdersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const prevOrdersRef = useRef<Map<number, string>>(new Map());

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data: Order[] = await res.json();
                setOrders(data);

                // Check for status changes and show notifications
                if (prevOrdersRef.current.size > 0) {
                    for (const order of data) {
                        const prevStatus = prevOrdersRef.current.get(order.id);
                        if (prevStatus && prevStatus !== order.status) {
                            if (order.status === "preparing") {
                                showToast(
                                    `🔪 Tu pedido #${order.orderNumber?.slice(-6)} está siendo preparado`,
                                    "info",
                                    "skillet"
                                );
                            } else if (order.status === "ready") {
                                showToast(
                                    `✅ ¡Tu pedido #${order.orderNumber?.slice(-6)} está listo para recoger!`,
                                    "success",
                                    "check_circle"
                                );
                                // Try browser notification via service worker (required in PWA/mobile)
                                if ("Notification" in window && Notification.permission === "granted") {
                                    try {
                                        if ("serviceWorker" in navigator) {
                                            navigator.serviceWorker.ready.then((reg) => {
                                                reg.showNotification("¡Pedido listo!", {
                                                    body: `Tu pedido #${order.orderNumber?.slice(-6)} está listo para recoger`,
                                                    icon: "/icon-192.png",
                                                });
                                            }).catch(() => { });
                                        }
                                    } catch {
                                        // Notification not supported in this context
                                    }
                                }
                            }
                        }
                    }
                }

                // Update the previous orders map
                const newMap = new Map<number, string>();
                for (const order of data) {
                    newMap.set(order.id, order.status);
                }
                prevOrdersRef.current = newMap;
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const filtered = orders.filter((o) =>
        tabs[activeTab].filter.includes(o.status)
    );

    const activeOrders = orders.filter(
        (o) => o.status === "preparing" || o.status === "ready"
    );

    const readyOrders = orders.filter((o) => o.status === "ready");

    return (
        <div className="flex flex-col min-h-dvh pb-24">
            <ToastNotification />

            {/* Header */}
            <header className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 pt-14 pb-4">
                <h1 className="text-2xl font-bold text-text-main dark:text-white mb-4">
                    Mis Pedidos
                </h1>

                {/* Tabs */}
                <div className="flex gap-2">
                    {tabs.map((tab, i) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(i)}
                            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${activeTab === i
                                ? "bg-primary text-text-main shadow-soft"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            {tab.label}
                            {i === 0 && activeOrders.length > 0 && (
                                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {filtered.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Ready order banner with QR */}
            {readyOrders.length > 0 && (
                <div className="mx-4 mt-4 rounded-2xl border-2 border-primary bg-primary/10 p-4 animate-pulse-glow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-text-main filled text-[24px]">
                                check_circle
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-text-main dark:text-white">
                                ¡{readyOrders.length === 1 ? "Pedido listo" : `${readyOrders.length} pedidos listos`}!
                            </p>
                            <p className="text-xs text-text-secondary">
                                Muestra el código QR en el mostrador
                            </p>
                        </div>
                    </div>

                    {readyOrders.map((order) => (
                        <button
                            key={order.id}
                            onClick={() => router.push(`/orders/${order.id}/qr`)}
                            className="w-full flex items-center justify-between rounded-xl bg-primary px-4 py-3 mt-2 text-text-main shadow-soft hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">
                                    qr_code_2
                                </span>
                                <span className="text-sm font-bold">
                                    Ver QR — #{order.orderNumber?.slice(-6)}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-[18px]">
                                arrow_forward
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Active order in preparation */}
            {activeTab === 0 && activeOrders.length > 0 && readyOrders.length === 0 && (
                <div className="mx-4 mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 filled text-[20px]">
                                skillet
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-main dark:text-white">
                                Pedido en preparación
                            </p>
                            <p className="text-xs text-text-secondary">
                                {activeOrders.length === 1
                                    ? "Tu pedido se está preparando ahora 🔪"
                                    : `${activeOrders.length} pedidos en preparación`}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500 animate-pulse"
                                style={{ width: "60%" }}
                            />
                        </div>
                        <span className="text-xs font-bold text-blue-500">
                            ~{activeOrders[0]?.estimatedMinutes || 10} min
                        </span>
                    </div>
                </div>
            )}

            {/* Order list */}
            <div className="flex flex-col gap-4 p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px] mb-4 animate-spin">
                            progress_activity
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            Cargando pedidos...
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[64px] mb-4">
                            {activeTab === 0 ? "local_shipping" : "receipt_long"}
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            {activeTab === 0 ? "No hay pedidos activos" : "Sin historial"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                            {activeTab === 0
                                ? "Cuando hagas un pedido aparecerá aquí"
                                : "Tus pedidos completados aparecerán aquí"}
                        </p>
                    </div>
                ) : (
                    filtered.map((order) => (
                        <div key={order.id}>
                            <OrderCard order={order} variant="customer" />
                            {/* QR button for ready orders */}
                            {order.status === "ready" && (
                                <button
                                    onClick={() => router.push(`/orders/${order.id}/qr`)}
                                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 text-primary-dark dark:text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                                    <span className="text-sm font-bold">Mostrar QR para recoger</span>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <NavBar variant="customer" />
        </div>
    );
}
