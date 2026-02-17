import type { Order } from "@/lib/types";

interface OrderCardProps {
    readonly order: Order;
    readonly variant?: "staff" | "customer";
    readonly onAction?: (order: Order, action: string) => void;
}

const statusConfig: Record<
    string,
    { label: string; color: string; icon: string; bgColor: string }
> = {
    pending: {
        label: "Pendiente",
        color: "text-yellow-400",
        icon: "schedule",
        bgColor: "bg-yellow-500/10",
    },
    preparing: {
        label: "Preparando",
        color: "text-blue-400",
        icon: "skillet",
        bgColor: "bg-blue-500/10",
    },
    ready: {
        label: "Listo",
        color: "text-primary",
        icon: "check_circle",
        bgColor: "bg-primary/10",
    },
    completed: {
        label: "Entregado",
        color: "text-gray-400",
        icon: "task_alt",
        bgColor: "bg-gray-500/10",
    },
};

export default function OrderCard({
    order,
    variant = "customer",
    onAction,
}: OrderCardProps) {
    const status = statusConfig[order.status] ?? statusConfig.pending;

    const staffActions: Record<string, { label: string; icon: string }> = {
        pending: { label: "Preparar", icon: "play_arrow" },
        preparing: { label: "Listo", icon: "check" },
        ready: { label: "Entregar", icon: "local_shipping" },
    };

    const action = staffActions[order.status];
    const items = Array.isArray(order.items) ? order.items : [];
    const total = order.totalAmount ? parseFloat(order.totalAmount) : 0;

    // Format date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-text-main dark:text-white">
                        {order.orderNumber}
                    </span>
                    {order.priority === "high" && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                            <span className="material-symbols-outlined text-[12px] filled">priority_high</span>
                            Urgente
                        </span>
                    )}
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.bgColor} ${status.color}`}>
                    <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                    {status.label}
                </div>
            </div>

            {/* Items */}
            <div className="px-4 py-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {item.name} — {item.qty}
                        </span>
                        <span className="text-sm font-semibold text-text-main dark:text-white">
                            {parseFloat(item.subtotal || item.unitPrice || "0").toFixed(2)} €
                        </span>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-sm text-gray-400 italic">Sin detalle de items</p>
                )}
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-yellow-500/5 dark:bg-yellow-500/10 p-2.5 border border-yellow-500/10">
                    <span className="material-symbols-outlined text-yellow-400 text-[16px] mt-0.5">
                        edit_note
                    </span>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 leading-relaxed">
                        {order.notes}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 p-4 pt-3">
                <div className="flex items-center gap-4">
                    {order.status !== "completed" && order.estimatedMinutes && (
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            ~{order.estimatedMinutes} min
                        </div>
                    )}
                    <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-text-main dark:text-white">
                        {total.toFixed(2)} €
                    </span>
                    {variant === "customer" && order.status === "ready" && (
                        <a
                            href={`/orders/${order.id}/qr`}
                            className="ml-2 flex items-center gap-1.5 rounded-full bg-text-main dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-text-main shadow-soft hover:brightness-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[16px]">qr_code</span>
                            Ver QR
                        </a>
                    )}
                    {variant === "staff" && action && onAction && (
                        <button
                            onClick={() => onAction(order, order.status)}
                            className="ml-2 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-text-main shadow-soft hover:brightness-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {action.icon}
                            </span>
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
