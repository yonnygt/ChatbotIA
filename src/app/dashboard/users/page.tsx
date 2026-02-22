"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { Section } from "@/lib/types";

interface UserRow {
    id: number;
    email: string;
    name: string;
    role: string;
    sectionId: number | null;
    createdAt: string | null;
}

export default function UsersPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && user) {
            if (user.role !== "admin") {
                router.replace("/dashboard");
                return;
            }
            loadUsers();
            loadSections();
        }
    }, [user, loading]);

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch {
        } finally {
            setFetching(false);
        }
    };

    const loadSections = async () => {
        try {
            const res = await fetch("/api/sections");
            if (res.ok) {
                const data = await res.json();
                setSections(data.sections || []);
            }
        } catch { }
    };

    const changeRole = async (userId: number, newRole: string) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
                );
            }
        } catch { }
    };

    const changeSection = async (userId: number, sectionId: number | null) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, sectionId }),
            });
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, sectionId } : u))
                );
            }
        } catch { }
    };

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-[#0f172a]">
                <span className="material-symbols-outlined text-primary/50 text-[48px] animate-spin">progress_activity</span>
            </div>
        );
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-emerald-500/15 border-emerald-500/20 text-emerald-400";
            case "staff":
                return "bg-blue-500/15 border-blue-500/20 text-blue-400";
            default:
                return "bg-white/5 border-white/10 text-slate-400";
        }
    };

    return (
        <div className="min-h-dvh bg-[#0f172a] pb-24 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[5%] left-[-10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="relative z-10 px-5 pt-14 pb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/dashboard/settings" className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-sm">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-white">Usuarios</h1>
                        <p className="text-xs text-slate-500">Gestionar roles y secciones</p>
                    </div>
                </div>
            </div>

            {/* Users list */}
            <div className="relative z-10 px-5 space-y-3">
                {users.map((u) => (
                    <div
                        key={u.id}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3"
                    >
                        {/* User info row */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{u.name}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-2">
                            {/* Role selector */}
                            <select
                                value={u.role}
                                onChange={(e) => changeRole(u.id, e.target.value)}
                                disabled={u.id === user?.id}
                                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all focus:outline-none bg-transparent ${getRoleBadge(u.role)} disabled:opacity-40`}
                            >
                                <option value="cliente" className="bg-[#0f172a] text-slate-300">Cliente</option>
                                <option value="staff" className="bg-[#0f172a] text-slate-300">Staff</option>
                                <option value="admin" className="bg-[#0f172a] text-slate-300">Admin</option>
                            </select>

                            {/* Section selector — only for staff */}
                            {(u.role === "staff") && (
                                <select
                                    value={u.sectionId ?? ""}
                                    onChange={(e) => changeSection(u.id, e.target.value ? Number(e.target.value) : null)}
                                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border bg-transparent border-white/10 text-slate-300 focus:outline-none focus:border-primary/30 transition-all"
                                >
                                    <option value="" className="bg-[#0f172a]">Sin sección</option>
                                    {sections.map((sec) => (
                                        <option key={sec.id} value={sec.id} className="bg-[#0f172a]">
                                            {sec.emoji} {sec.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
