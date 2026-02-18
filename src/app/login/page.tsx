"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading, fetchUser, login, register } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (!loading && user) {
            if (user.role === "admin" || user.role === "staff") {
                router.replace("/dashboard");
            } else {
                router.replace("/");
            }
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (mode === "login") {
                const u = await login(email, password);
                if (u.role === "admin" || u.role === "staff") {
                    router.replace("/dashboard");
                } else {
                    router.replace("/");
                }
            } else {
                if (!name.trim()) {
                    setError("El nombre es requerido");
                    setSubmitting(false);
                    return;
                }
                await register(email, password, name);
                router.replace("/");
            }
        } catch (err: any) {
            setError(err.message || "Error inesperado");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background-dark">
                <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">
                    progress_activity
                </span>
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-dvh bg-background-dark px-6 relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-primary/20 blur-[100px] pointer-events-none animate-float" />
            <div className="absolute bottom-[-80px] right-[-40px] w-[200px] h-[200px] rounded-full bg-primary/15 blur-[80px] pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 mb-4">
                        <span className="material-symbols-outlined text-primary text-[32px] filled">storefront</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">
                        Butcher<span className="text-primary">AI</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Carnicería Inteligente</p>
                </div>

                {/* Mode tabs */}
                <div className="flex rounded-2xl bg-surface-dark p-1 mb-6">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "login"
                            ? "bg-primary text-background-dark shadow-soft"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "register"
                            ? "bg-primary text-background-dark shadow-soft"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Registrarse
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nombre</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">person</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre completo"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Contraseña</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-dark border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl p-3">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 rounded-xl bg-primary text-background-dark font-bold text-sm shadow-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                        ) : mode === "login" ? (
                            "Entrar"
                        ) : (
                            "Crear Cuenta"
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-6">
                    {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                        className="text-primary font-bold hover:underline"
                    >
                        {mode === "login" ? "Regístrate" : "Inicia sesión"}
                    </button>
                </p>
            </div>
        </div>
    );
}
