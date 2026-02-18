"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface UserRow {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string | null;
}

export default function UsersPage() {
    const router = useRouter();
    const { user, loading, fetchUser } = useAuth();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => { fetchUser(); }, []);

    useEffect(() => {
        if (!loading && user) {
            if (user.role !== "admin") {
                router.replace("/dashboard");
                return;
            }
            loadUsers();
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

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background-dark">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-background-dark pb-24">
            {/* Header */}
            <div className="px-5 pt-14 pb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/dashboard/settings" className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_back</span>
                    </Link>
                    <h1 className="text-xl font-extrabold text-white">Usuarios</h1>
                </div>
                <p className="text-sm text-gray-400 ml-12">Gestionar roles de usuario</p>
            </div>

            {/* Users list */}
            <div className="px-5 space-y-3">
                {users.map((u) => (
                    <div
                        key={u.id}
                        className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex items-center gap-4"
                    >
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            disabled={u.id === user?.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none ${u.role === "admin"
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : u.role === "staff"
                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                                    : "bg-white/5 border-white/10 text-gray-300"
                                } disabled:opacity-40`}
                        >
                            <option value="cliente">Cliente</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
