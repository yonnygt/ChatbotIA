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
        <div className="flex flex-col min-h-dvh bg-background-light">
            {/* Header */}
            <header className="px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-text-main border border-gray-100/80 hover:bg-gray-50 transition-colors active:scale-95"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-elevated border border-gray-100/80 text-center relative overflow-hidden gradient-border">
                    {/* Decorative scanning line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 pointer-events-none opacity-30" style={{ animation: "scan 2s infinite linear" }} />

                    <div className="mb-6">
                        <h1 className="text-2xl font-extrabold text-text-main mb-2">
                            Código de Retiro
                        </h1>
                        <p className="text-sm text-text-secondary">
                            Muestra este código al carnicero para recoger tu pedido.
                        </p>
                    </div>

                    <div className="flex justify-center mb-8 p-4 bg-background-light rounded-2xl mx-auto w-fit shadow-inner border border-gray-50">
                        <QRCode value={`PICKUP:${orderId}`} width={200} />
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-6 text-primary font-bold bg-primary/10 py-2.5 px-5 rounded-full mx-auto w-fit text-sm">
                        <span className="material-symbols-outlined text-[20px]">timer</span>
                        <span>Válido por {formatTime(timeLeft)}</span>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-xs text-text-secondary/50 mb-2">
                            Pedido #{orderId.slice(-6)}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-text-main font-medium">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            Estado: Listo para retirar
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
