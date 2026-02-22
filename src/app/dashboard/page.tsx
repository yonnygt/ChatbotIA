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

    const handleCancel = async (order: Order) => {
        if (!confirm(`¿Cancelar pedido ${order.orderNumber}?`)) return;

        try {
            await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
            });
            fetchOrders();
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast(`Pedido ${order.orderNumber} cancelado`, "warning");
            }
        } catch {
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast("Error al cancelar", "warning");
            }
        }
    };

    const filters = [
        { key: "all", label: "Todos", icon: "list" },
        { key: "pending", label: "Pendientes", icon: "schedule" },
        { key: "preparing", label: "Preparando", icon: "skillet" },
        { key: "ready", label: "Listos", icon: "check_circle" },
    ];

    const activeOrders = filter === "all" ? orders : orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
    const filteredOrders = filter === "all" ? activeOrders : activeOrders.filter((o) => o.status === filter);

    const counts = {
        pending: activeOrders.filter((o) => o.status === "pending").length,
        preparing: activeOrders.filter((o) => o.status === "preparing").length,
        ready: activeOrders.filter((o) => o.status === "ready").length,
    };

    return (
        <div className="flex flex-col min-h-dvh bg-[#0f172a] text-slate-100 relative overflow-hidden">
            <ToastNotification />

            {/* Background glow effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-15%] w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 px-5 pt-14 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em]">Panel de control</p>
                        <h1 className="text-2xl font-black text-white tracking-tight mt-1">Pedidos</h1>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-3.5 py-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-slate-300">{activeOrders.length} activos</span>
                    </div>
                </div>
            </header>

            {/* Stats cards */}
            <div className="relative z-10 flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                {[
                    { label: "Pendientes", count: counts.pending, gradient: "from-amber-500/20 to-amber-600/10", text: "text-amber-400", border: "border-amber-500/20" },
                    { label: "Preparando", count: counts.preparing, gradient: "from-blue-500/20 to-blue-600/10", text: "text-blue-400", border: "border-blue-500/20" },
                    { label: "Listos", count: counts.ready, gradient: "from-emerald-500/20 to-emerald-600/10", text: "text-emerald-400", border: "border-emerald-500/20" },
                ].map((stat) => (
                    <div key={stat.label} className={`flex-1 min-w-0 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border} p-3.5 backdrop-blur-sm`}>
                        <p className={`text-2xl font-black ${stat.text} tabular-nums`}>{stat.count}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="relative z-10 flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${filter === f.key
                            ? "bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] shadow-[0_4px_12px_rgba(19,236,91,0.25)]"
                            : "bg-white/5 text-slate-400 border border-white/10 hover:border-primary/30 hover:text-primary backdrop-blur-sm"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Orders */}
            <main className="relative z-10 flex-1 px-5 pb-28 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 mb-4">
                            <span className="material-symbols-outlined text-slate-500 text-[40px]">inbox</span>
                        </div>
                        <p className="text-base font-bold text-white">No hay pedidos</p>
                        <p className="text-sm text-slate-500 mt-1">
                            {filter === "all" ? "Aún no hay pedidos activos" : `No hay pedidos en estado "${filter}"`}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} variant="staff" onAction={handleAction} onCancel={handleCancel} />
                    ))
                )}
            </main>

            <NavBar variant="staff" />
        </div>
    );
}
