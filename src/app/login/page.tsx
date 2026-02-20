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
        <div className="flex flex-col items-center justify-center min-h-dvh bg-background-light px-6 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none -ml-32 -mb-32" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                        <span className="material-symbols-outlined text-primary text-[28px] filled">storefront</span>
                    </div>
                    <h1 className="text-4xl font-bold text-text-main">
                        Butcher<span className="text-primary">AI</span>
                    </h1>
                    <p className="text-base text-text-secondary mt-2">Carnicería Inteligente</p>
                </div>

                {/* Mode tabs */}
                <div className="flex rounded-lg bg-surface-highlight p-1 mb-8 gap-2">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "login"
                            ? "bg-white text-primary shadow-sm"
                            : "text-text-secondary hover:text-text-main"
                            }`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "register"
                            ? "bg-white text-primary shadow-sm"
                            : "text-text-secondary hover:text-text-main"
                            }`}
                    >
                        Registrarse
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === "register" && (
                        <div>
                            <label className="text-sm font-semibold text-text-main mb-2 block">Nombre Completo</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">person</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Juan Pérez"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-light border border-gray-200 text-text-main text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-text-main mb-2 block">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                required
                                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-light border border-gray-200 text-text-main text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-text-main mb-2 block">Contraseña</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">lock</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-light border border-gray-200 text-text-main text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg p-3">
                            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="material-symbols-outlined text-[18px] animate-spin inline">progress_activity</span>
                        ) : mode === "login" ? (
                            "Entrar"
                        ) : (
                            "Crear Cuenta"
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-text-secondary mt-6">
                    {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                        className="text-primary font-semibold hover:text-primary-dark transition-colors"
                    >
                        {mode === "login" ? "Regístrate" : "Inicia sesión"}
                    </button>
                </p>
            </div>
        </div>
    );
}
