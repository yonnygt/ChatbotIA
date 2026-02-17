"use client";

import { useState, useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import OrderCard from "@/components/OrderCard";
import type { Order } from "@/lib/types";

const statusFilters = [
    { label: "Todos", status: "all" },
    { label: "Pendientes", status: "pending" },
    { label: "Preparando", status: "preparing" },
    { label: "Listos", status: "ready" },
];

export default function DashboardPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const filtered =
        activeFilter === "all"
            ? orders
            : orders.filter((o) => o.status === activeFilter);

    const handleAction = async (order: Order, currentStatus: string) => {
        const nextStatus: Record<string, string> = {
            pending: "preparing",
            preparing: "ready",
            ready: "completed",
        };

        const newStatus = nextStatus[currentStatus];
        if (!newStatus) return;

        // Optimistic update
        setOrders((prev) =>
            prev.map((o) =>
                o.id === order.id ? { ...o, status: newStatus } : o
            )
        );

        try {
            await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, status: newStatus }),
            });
        } catch (error) {
            console.error("Error updating order:", error);
            // Revert on error
            fetchOrders();
        }
    };

    const counts = {
        pending: orders.filter((o) => o.status === "pending").length,
        preparing: orders.filter((o) => o.status === "preparing").length,
        ready: orders.filter((o) => o.status === "ready").length,
    };

    return (
        <div className="flex flex-col min-h-dvh pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-white">
                            Panel de Pedidos
                        </h1>
                        <p className="text-sm text-text-secondary mt-0.5">
                            {orders.length} pedido{orders.length !== 1 ? "s" : ""} registrado{orders.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-text-main shadow-soft hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            refresh
                        </span>
                        Actualizar
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/10 p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
                        <p className="text-[10px] font-medium text-yellow-400/80 mt-0.5">
                            Pendientes
                        </p>
                    </div>
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/10 p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{counts.preparing}</p>
                        <p className="text-[10px] font-medium text-blue-400/80 mt-0.5">
                            Preparando
                        </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 border border-primary/10 p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{counts.ready}</p>
                        <p className="text-[10px] font-medium text-primary/80 mt-0.5">
                            Listos
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {statusFilters.map((f) => (
                        <button
                            key={f.status}
                            onClick={() => setActiveFilter(f.status)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${activeFilter === f.status
                                ? "bg-primary text-text-main shadow-soft"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Orders */}
            <div className="flex flex-col gap-4 p-4">
                {loading ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px] mb-4 animate-spin">
                            progress_activity
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            Cargando pedidos...
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[64px] mb-4">
                            receipt_long
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            No hay pedidos
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Los pedidos aparecerán aquí cuando los clientes los confirmen
                        </p>
                    </div>
                ) : (
                    filtered.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            variant="staff"
                            onAction={handleAction}
                        />
                    ))
                )}
            </div>

            <NavBar variant="staff" />
        </div>
    );
}
