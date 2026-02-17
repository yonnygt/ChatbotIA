"use client";

import { useState, useEffect, useCallback } from "react";

interface Toast {
    id: string;
    message: string;
    type: "info" | "success" | "warning";
    icon: string;
}

export default function ToastNotification() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { ...toast, id }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Expose addToast globally
    useEffect(() => {
        (window as any).__addToast = addToast;
        return () => {
            delete (window as any).__addToast;
        };
    }, [addToast]);

    const typeStyles: Record<string, string> = {
        info: "bg-blue-500/90 border-blue-400/30",
        success: "bg-emerald-500/90 border-emerald-400/30",
        warning: "bg-amber-500/90 border-amber-400/30",
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-lg border backdrop-blur-sm animate-slide-down ${typeStyles[toast.type]}`}
                    onClick={() => removeToast(toast.id)}
                >
                    <span className="material-symbols-outlined text-[22px] filled">
                        {toast.icon}
                    </span>
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <span className="material-symbols-outlined text-[16px] opacity-60 cursor-pointer">
                        close
                    </span>
                </div>
            ))}
        </div>
    );
}

// Helper function to show toast from anywhere
export function showToast(message: string, type: Toast["type"] = "info", icon = "notifications") {
    if (typeof window !== "undefined" && (window as any).__addToast) {
        (window as any).__addToast({ message, type, icon });
    }
}
