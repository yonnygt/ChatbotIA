"use client";

import { useState, useCallback, useEffect } from "react";

interface Toast {
    id: number;
    message: string;
    type: "info" | "success" | "warning";
}

const typeConfig = {
    info: {
        icon: "info",
        classes: "bg-blue-500 text-white",
    },
    success: {
        icon: "check_circle",
        classes: "bg-primary text-background-dark",
    },
    warning: {
        icon: "warning",
        classes: "bg-amber-500 text-white",
    },
};

export default function ToastNotification() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: "info" | "success" | "warning" = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    useEffect(() => {
        (window as any).__addToast = addToast;
        return () => {
            delete (window as any).__addToast;
        };
    }, [addToast]);

    if (!toasts.length) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pt-4 pointer-events-none">
            {toasts.map((toast) => {
                const config = typeConfig[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-elevated ${config.classes} animate-slide-down pointer-events-auto`}
                    >
                        <span className="material-symbols-outlined text-[20px] filled">{config.icon}</span>
                        <span className="text-sm font-bold">{toast.message}</span>
                    </div>
                );
            })}
        </div>
    );
}
