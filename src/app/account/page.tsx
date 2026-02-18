"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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
            <div className="flex items-center justify-center min-h-dvh bg-background-light">
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

    return (
        <div className="min-h-dvh bg-background-light pb-24">
            {/* Header */}
            <div className="bg-gradient-to-b from-background-dark to-surface-dark px-5 pt-14 pb-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[32px] filled">person</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-white">{user.name}</h1>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="px-5 -mt-3 space-y-3">
                <div className="bg-white rounded-2xl shadow-soft p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-text">Rol</span>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                            {roleLabels[user.role] || user.role}
                        </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-text">Email</span>
                        <span className="text-sm font-medium text-gray-800">{user.email}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-500 font-bold text-sm hover:bg-red-100 active:scale-[0.98] transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
