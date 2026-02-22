"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef, type ReactNode } from "react";
import ToastNotification from "@/components/ToastNotification";
import { useAuth } from "@/hooks/useAuth";

function OrderStatusMonitor() {
    const { user } = useAuth();
    const previousStatuses = useRef<Record<string, string>>({});
    const notificationPermission = useRef(false);
    const swRegistration = useRef<ServiceWorkerRegistration | null>(null);
    const isFirstRun = useRef(true);

    useEffect(() => {
        // Register Service Worker + request notification permission
        async function setup() {
            // Register SW first (required for mobile notifications)
            if ("serviceWorker" in navigator) {
                try {
                    const reg = await navigator.serviceWorker.register("/sw.js");
                    swRegistration.current = reg;
                    console.log("[OrderMonitor] Service Worker registered:", reg.scope);
                } catch (err) {
                    console.warn("[OrderMonitor] SW registration failed:", err);
                }
            }

            // Then request notification permission
            if ("Notification" in window && Notification.permission === "default") {
                const permission = await Notification.requestPermission();
                notificationPermission.current = permission === "granted";
            } else if ("Notification" in window && Notification.permission === "granted") {
                notificationPermission.current = true;
            }
        }

        setup();
    }, []);

    useEffect(() => {
        // Only monitor for cliente users
        if (!user || user.role !== "cliente") {
            isFirstRun.current = true;
            return;
        }

        const checkOrders = async () => {
            try {
                const res = await fetch("/api/orders");
                if (res.ok) {
                    const data = await res.json();
                    const orders = data.orders || [];

                    // On first run, just populate the cache without sending notifications
                    if (isFirstRun.current) {
                        console.log(`[OrderMonitor] First run - caching ${orders.length} order statuses`);
                        previousStatuses.current = Object.fromEntries(
                            orders.map((o: any) => [o.id, o.status])
                        );
                        isFirstRun.current = false;
                        return;
                    }

                    orders.forEach((order: any) => {
                        const prevStatus = previousStatuses.current[order.id];
                        if (prevStatus && prevStatus !== order.status) {
                            let message = "";
                            let type: "info" | "success" = "info";

                            if (order.status === "preparing") {
                                message = `Pedido #${order.orderNumber?.slice(-6) || order.id} en preparación 🔪`;
                                type = "info";
                            } else if (order.status === "ready") {
                                message = `¡Pedido #${order.orderNumber?.slice(-6) || order.id} listo! 🎉`;
                                type = "success";
                            }

                            if (message) {
                                console.log(`[OrderMonitor] Status changed: ${prevStatus} → ${order.status} for order ${order.id}`);

                                // Show in-app toast
                                if ((window as any).__addToast) {
                                    (window as any).__addToast(message, type);
                                }

                                // Show push notification via Service Worker (works on mobile + desktop)
                                if (notificationPermission.current && swRegistration.current) {
                                    swRegistration.current.showNotification("SuperMarket AI", {
                                        body: message,
                                        icon: "/favicon.ico",
                                        badge: "/favicon.ico",
                                        tag: `order-${order.id}-${order.status}`,
                                        vibrate: [200, 100, 200],
                                        requireInteraction: false,
                                    } as NotificationOptions);
                                } else if (notificationPermission.current && "Notification" in window) {
                                    // Fallback for browsers without SW support
                                    new Notification("SuperMarket AI", {
                                        body: message,
                                        icon: "/favicon.ico",
                                        tag: `order-${order.id}-${order.status}`,
                                    });
                                }
                            }
                        }
                        // Always update the cached status
                        previousStatuses.current[order.id] = order.status;
                    });
                }
            } catch (error) {
                // Silently ignore fetch errors (e.g. network issues on mobile, tunnel disconnects)
                // This prevents console spam when accessed via tunnels like Cloudflare
                console.debug("[OrderMonitor] Fetch error (will retry):", (error as Error).message);
            }
        };

        checkOrders();
        const interval = setInterval(checkOrders, 8000);
        return () => clearInterval(interval);
    }, [user]);

    return null;
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 1000,
                        refetchInterval: 10 * 1000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ToastNotification />
            <OrderStatusMonitor />
            {children}
        </QueryClientProvider>
    );
}
