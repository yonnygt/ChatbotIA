"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function AccountPage() {
    const router = useRouter();
    const { user, loading, fetchUser, logout } = useAuth();

    useEffect(() => { fetchUser(); }, []);

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-[#f3f6f4]">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">progress_activity</span>
            </div>
        );
    }

    if (!user) return null;

    const roleLabels: Record<string, string> = {
        cliente: "Cliente",
        staff: "Staff",
        admin: "Administrador",
    };

    const roleColors: Record<string, { bg: string; text: string; border: string }> = {
        cliente: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
        staff: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
        admin: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    };

    const roleColor = roleColors[user.role] || roleColors.cliente;

    return (
        <div className="min-h-dvh bg-[#f8fafc] pb-24">
            {/* Header with improved gradient and patterns */}
            <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 pt-16 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-primary/20 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px]" />
                </div>

                <div className="relative max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
                            <span className="material-symbols-outlined text-white text-[22px]">arrow_back</span>
                        </Link>
                        <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Perfil de Usuario</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-2xl transition-transform group-hover:scale-105 duration-500">
                                <div className="h-full w-full rounded-[1.9rem] bg-[#0f172a] flex items-center justify-center overflow-hidden border-2 border-[#0f172a]">
                                    <span className="material-symbols-outlined text-white text-[48px] filled opacity-90 group-hover:scale-110 transition-transform duration-500">account_circle</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-emerald-500 border-4 border-[#0f172a] flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-[16px] filled">verified</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
                            </div>
                            <div className="flex items-center gap-2 opacity-70">
                                <span className="material-symbols-outlined text-white text-[16px]">alternate_email</span>
                                <p className="text-sm text-white font-medium">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto px-6 -mt-10 space-y-6 relative z-10">

                {/* Modern Status Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl ${roleColor.bg} flex items-center justify-center shadow-inner`}>
                            <span className={`material-symbols-outlined ${roleColor.text} text-[28px] filled`}>
                                {user.role === "admin" ? "verified_user" : user.role === "staff" ? "support_agent" : "person_check"}
                            </span>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Estado de la cuenta</p>
                            <p className={`text-lg font-black ${roleColor.text}`}>{roleLabels[user.role] || user.role}</p>
                        </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Security/Info Info */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-indigo-500 text-[24px]">fingerprint</span>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">ID de Usuario</p>
                            <p className="text-sm font-bold text-slate-700 font-mono">#{user.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/40 border border-slate-100 flex flex-col justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-amber-500 text-[24px]">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Miembro desde</p>
                            <p className="text-sm font-bold text-slate-700">
                                {new Date(user.createdAt || '').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="bg-white rounded-[2.5rem] p-2 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-1 gap-1">
                        <Link
                            href="/orders"
                            className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all rounded-[1.8rem] group"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-emerald-600 text-[24px]">shopping_bag</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-slate-800">Mis Pedidos</p>
                                <p className="text-xs text-slate-400 font-medium">Gestiona tus compras recientes</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">chevron_right</span>
                        </Link>

                        <div className="px-6">
                            <div className="h-px bg-slate-100" />
                        </div>

                        <Link
                            href="/favorites"
                            className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all rounded-[1.8rem] group"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-rose-600 text-[24px] filled">favorite</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-slate-800">Favoritos</p>
                                <p className="text-xs text-slate-400 font-medium">Tus productos preferidos</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all">chevron_right</span>
                        </Link>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white border-2 border-red-50 text-red-500 font-black text-sm hover:bg-red-50 hover:border-red-100 active:scale-[0.98] transition-all shadow-sm group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-red-100/50 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <span className="material-symbols-outlined text-[22px]">logout</span>
                            </div>
                            <span className="tracking-tight">CERRAR SESIÓN</span>
                        </div>
                        <span className="material-symbols-outlined text-red-200 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    <p className="text-center mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                        Chatbot AI • Version 2.0.4
                    </p>
                </div>
            </div>
        </div>
    );
}
