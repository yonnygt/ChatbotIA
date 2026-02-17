"use client";

import { useParams, useRouter } from "next/navigation";
import QRCode from "@/components/QRCode";
import { useEffect, useState } from "react";

export default function OrderPickupPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes validity

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark shadow-sm text-text-main dark:text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
                <div className="w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
                    {/* Decorative scanning line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-scan pointer-events-none opacity-20" />

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
                            Código de Retiro
                        </h1>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Muestra este código al carnicero para recoger tu pedido.
                        </p>
                    </div>

                    <div className="flex justify-center mb-8 p-4 bg-white rounded-2xl mx-auto w-fit shadow-inner">
                        <QRCode value={`PICKUP:${orderId}`} width={200} />
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-6 text-primary font-medium bg-primary/10 py-2 px-4 rounded-full mx-auto w-fit">
                        <span className="material-symbols-outlined text-[20px]">timer</span>
                        <span>Válido por {formatTime(timeLeft)}</span>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                            Pedido #{orderId.slice(-6)}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-text-main dark:text-gray-300">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Estado: Listo para retirar
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
