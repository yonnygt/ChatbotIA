"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface RateInfo {
    rate: string | null;
    currency?: string;
    source?: string;
    fetchedAt?: string;
}

export default function SettingsPage() {
    const { user, loading, fetchUser } = useAuth();
    const [rateInfo, setRateInfo] = useState<RateInfo>({ rate: null });
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    useEffect(() => { fetchUser(); }, []);
    useEffect(() => { loadRate(); }, []);

    const loadRate = async () => {
        try {
            const res = await fetch("/api/exchange-rate");
            if (res.ok) {
                const data = await res.json();
                setRateInfo(data);
            }
        } catch { }
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch("/api/exchange-rate/sync", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setSyncResult(`✅ Tasa actualizada: ${data.rate} Bs/USD`);
                loadRate();
            } else {
                setSyncResult(`❌ ${data.error}`);
            }
        } catch {
            setSyncResult("❌ Error de conexión");
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background-dark">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">progress_activity</span>
            </div>
        );
    }

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "Nunca";
        return new Date(dateStr).toLocaleString("es-VE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-dvh bg-background-dark pb-24">
            {/* Header */}
            <div className="px-5 pt-14 pb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/dashboard" className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_back</span>
                    </Link>
                    <h1 className="text-xl font-extrabold text-white">Ajustes</h1>
                </div>
            </div>

            <div className="px-5 space-y-4">
                {/* Exchange Rate Card */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px]">currency_exchange</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Tasa de Cambio BCV</h3>
                            <p className="text-xs text-gray-400">Dólar oficial del Banco Central</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-background-dark rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Tasa Actual</p>
                            <p className="text-lg font-extrabold text-primary tabular-nums">
                                {rateInfo.rate ? `${parseFloat(rateInfo.rate).toFixed(2)}` : "—"}
                            </p>
                            <p className="text-[10px] text-gray-500">Bs/USD</p>
                        </div>
                        <div className="bg-background-dark rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Última Sync</p>
                            <p className="text-xs font-medium text-gray-300">
                                {formatDate(rateInfo.fetchedAt)}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="w-full py-3 rounded-xl bg-primary text-background-dark font-bold text-sm shadow-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${syncing ? "animate-spin" : ""}`}>
                            {syncing ? "progress_activity" : "sync"}
                        </span>
                        {syncing ? "Sincronizando..." : "Sincronizar con BCV"}
                    </button>

                    {syncResult && (
                        <p className="text-xs text-center mt-3 text-gray-300">{syncResult}</p>
                    )}
                </div>

                {/* Admin: User Management */}
                {user?.role === "admin" && (
                    <Link
                        href="/dashboard/users"
                        className="flex items-center gap-4 bg-surface-dark border border-white/5 rounded-2xl p-4 hover:border-primary/20 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">group</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">Gestionar Usuarios</p>
                            <p className="text-xs text-gray-400">Cambiar roles y permisos</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-500 text-[20px]">chevron_right</span>
                    </Link>
                )}

                {/* Logout for staff */}
                <button
                    onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/login";
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
