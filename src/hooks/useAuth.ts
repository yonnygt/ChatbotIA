"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthState {
    user: User | null;
    loading: boolean;
    fetchUser: () => Promise<void>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    fetchUser: async () => {
        try {
            set({ loading: true });
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                set({ user: data.user });
            } else {
                set({ user: null });
            }
        } catch {
            set({ user: null });
        } finally {
            set({ loading: false });
        }
    },
}));

export function useAuth() {
    const { user, loading, fetchUser, setUser, setLoading } = useAuthStore();

    const login = async (email: string, password: string) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        return data.user;
    };

    const register = async (email: string, password: string, name: string) => {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
    };

    return { user, loading, fetchUser, login, register, logout };
}
