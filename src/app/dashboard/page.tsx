"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
import OrderCard from "@/components/OrderCard";
import ToastNotification from "@/components/ToastNotification";
import type { Order } from "@/lib/types";

export default function DashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (order: Order, currentStatus: string) => {
        const nextStatus: Record<string, string> = {
            pending: "preparing",
            preparing: "ready",
            ready: "completed",
        };
        const newStatus = nextStatus[currentStatus];
        if (!newStatus) return;

        try {
            await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchOrders();
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast(`Pedido ${order.orderNumber} → ${newStatus}`, "success");
            }
        } catch {
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast("Error al actualizar", "warning");
            }
        }
    };

    const filters = [
        { key: "all", label: "Todos", icon: "list" },
        { key: "pending", label: "Pendientes", icon: "schedule" },
        { key: "preparing", label: "Preparando", icon: "skillet" },
        { key: "ready", label: "Listos", icon: "check_circle" },
    ];

    const activeOrders = orders.filter((o) => o.status !== "completed");
    const filteredOrders = filter === "all" ? activeOrders : activeOrders.filter((o) => o.status === filter);

    const counts = {
        pending: activeOrders.filter((o) => o.status === "pending").length,
        preparing: activeOrders.filter((o) => o.status === "preparing").length,
        ready: activeOrders.filter((o) => o.status === "ready").length,
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background-dark text-white">
            <ToastNotification />

            {/* Header */}
            <header className="px-5 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-primary/70 uppercase tracking-wider">Panel de control</p>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Pedidos</h1>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-surface-dark border border-white/5 px-3.5 py-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-text-light">{activeOrders.length} activos</span>
                    </div>
                </div>
            </header>

            {/* Stats cards */}
            <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                {[
                    { label: "Pendientes", count: counts.pending, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
                    { label: "Preparando", count: counts.preparing, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15" },
                    { label: "Listos", count: counts.ready, color: "text-primary", bg: "bg-primary/10", border: "border-primary/15" },
                ].map((stat) => (
                    <div key={stat.label} className={`flex-1 min-w-0 rounded-2xl ${stat.bg} border ${stat.border} p-3.5`}>
                        <p className={`text-2xl font-extrabold ${stat.color} tabular-nums`}>{stat.count}</p>
                        <p className="text-[11px] text-text-light/50 font-medium mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${filter === f.key
                            ? "bg-primary text-background-dark shadow-soft"
                            : "bg-surface-dark/60 text-text-light/60 border border-white/5 hover:border-primary/20 hover:text-primary"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Orders */}
            <main className="flex-1 px-5 pb-28 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-36 rounded-2xl bg-surface-dark/50 animate-pulse" />
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/8 mb-4">
                            <span className="material-symbols-outlined text-primary/30 text-[40px]">inbox</span>
                        </div>
                        <p className="text-base font-bold text-white">No hay pedidos</p>
                        <p className="text-sm text-text-light/40 mt-1">
                            {filter === "all" ? "Aún no hay pedidos activos" : `No hay pedidos en estado "${filter}"`}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} variant="staff" onAction={handleAction} />
                    ))
                )}
            </main>

            <NavBar variant="staff" />
        </div>
    );
}
