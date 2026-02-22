import type { Order } from "@/lib/types";

interface OrderCardProps {
    readonly order: Order;
    readonly variant?: "staff" | "customer";
    readonly onAction?: (order: Order, action: string) => void;
    readonly onCancel?: (order: Order) => void;
}

const statusConfig: Record<
    string,
    { label: string; color: string; icon: string; bgColor: string; border: string }
> = {
    pending: {
        label: "Pendiente",
        color: "text-amber-500",
        icon: "schedule",
        bgColor: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
    preparing: {
        label: "Preparando",
        color: "text-blue-500",
        icon: "skillet",
        bgColor: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    ready: {
        label: "Listo",
        color: "text-primary",
        icon: "check_circle",
        bgColor: "bg-primary/10",
        border: "border-primary/20",
    },
    completed: {
        label: "Entregado",
        color: "text-gray-400",
        icon: "task_alt",
        bgColor: "bg-gray-500/8",
        border: "border-gray-300/20",
    },
    cancelled: {
        label: "Cancelado",
        color: "text-red-400",
        icon: "cancel",
        bgColor: "bg-red-500/10",
        border: "border-red-500/20",
    },
};

export default function OrderCard({
    order,
    variant = "customer",
    onAction,
    onCancel,
}: OrderCardProps) {
    const status = statusConfig[order.status] ?? statusConfig.pending;
    const isStaff = variant === "staff";

    const staffActions: Record<string, { label: string; icon: string }> = {
        pending: { label: "Preparar", icon: "play_arrow" },
        preparing: { label: "Listo", icon: "check" },
        ready: { label: "Entregar", icon: "local_shipping" },
    };

    const action = staffActions[order.status];
    const items = Array.isArray(order.items) ? order.items : [];
    const total = order.totalAmount ? parseFloat(order.totalAmount) : 0;
    const canCancel = isStaff && onCancel && order.status !== "completed" && order.status !== "cancelled";

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return dateStr;
        }
    };

    // Dark styled card for staff, light for customer
    const cardClasses = isStaff
        ? `rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]`
        : `rounded-2xl bg-surface-light dark:bg-surface-dark border dark:border-white/5 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-elevated gradient-border ${status.border} border-gray-100/80`;

    return (
        <div className={cardClasses}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-base font-extrabold tracking-tight shrink-0 ${isStaff ? "text-white" : "text-text-main dark:text-white"}`}>
                        {order.orderNumber}
                    </span>
                    {order.priority === "high" && (
                        <span className="flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/15 shrink-0">
                            <span className="material-symbols-outlined text-[11px] filled">priority_high</span>
                            Urgente
                        </span>
                    )}
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 ${status.bgColor} ${status.color}`}>
                    <span className="material-symbols-outlined text-[13px]">{status.icon}</span>
                    {status.label}
                </div>
            </div>

            {/* Items */}
            <div className="px-4 py-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                        <span className={`text-[13px] truncate mr-2 ${isStaff ? "text-slate-400" : "text-text-secondary dark:text-gray-400"}`}>
                            {item.name} — {item.qty}
                        </span>
                        <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${isStaff ? "text-white" : "text-text-main dark:text-white"}`}>
                            {parseFloat(item.subtotal || item.unitPrice || "0").toFixed(2)} €
                        </span>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-[13px] text-slate-500 italic">Sin detalle de items</p>
                )}
            </div>

            {/* Notes */}
            {order.notes && (
                <div className={`mx-4 mb-2 flex items-start gap-2 rounded-xl p-2 border ${isStaff ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10"}`}>
                    <span className="material-symbols-outlined text-amber-500 text-[14px] mt-0.5 shrink-0">
                        edit_note
                    </span>
                    <p className={`text-[11px] leading-relaxed ${isStaff ? "text-amber-300" : "text-amber-600 dark:text-amber-300"}`}>
                        {order.notes}
                    </p>
                </div>
            )}

            {/* Footer — Staff (stacked layout for mobile) */}
            {isStaff ? (
                <div className="border-t border-white/5 p-3 space-y-2.5">
                    {/* Row 1: Meta info + Total */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {order.status !== "completed" && order.status !== "cancelled" && order.estimatedMinutes && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <span className="material-symbols-outlined text-[13px]">timer</span>
                                    ~{order.estimatedMinutes} min
                                </div>
                            )}
                            <span className="text-[11px] text-slate-600">
                                {formatDate(order.createdAt)}
                            </span>
                        </div>
                        <span className="text-sm font-extrabold text-white tabular-nums">
                            {total.toFixed(2)} €
                        </span>
                    </div>

                    {/* Row 2: Action buttons — full width on mobile */}
                    {(canCancel || (action && onAction)) && (
                        <div className="flex items-center gap-2">
                            {canCancel && (
                                <button
                                    onClick={() => onCancel!(order)}
                                    className="flex items-center justify-center gap-1 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                    Cancelar
                                </button>
                            )}
                            {action && onAction && (
                                <button
                                    onClick={() => onAction(order, order.status)}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-emerald-400 px-4 py-2 text-[11px] font-black text-[#0f172a] shadow-[0_4px_12px_rgba(19,236,91,0.25)] hover:shadow-[0_6px_16px_rgba(19,236,91,0.35)] hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[15px]">
                                        {action.icon}
                                    </span>
                                    {action.label}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* Footer — Customer (compact single row) */
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 p-4 pt-3">
                    <div className="flex items-center gap-4">
                        {order.status !== "completed" && order.estimatedMinutes && (
                            <div className="flex items-center gap-1 text-xs text-text-secondary">
                                <span className="material-symbols-outlined text-[14px]">timer</span>
                                ~{order.estimatedMinutes} min
                            </div>
                        )}
                        <span className="text-xs text-text-secondary/60">
                            {formatDate(order.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-text-main dark:text-white tabular-nums">
                            {total.toFixed(2)} €
                        </span>
                        {order.status === "ready" && (
                            <a
                                href={`/orders/${order.id}/qr`}
                                className="ml-2 flex items-center gap-1.5 rounded-full bg-background-dark dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-background-dark shadow-soft hover:brightness-110 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">qr_code</span>
                                Ver QR
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
