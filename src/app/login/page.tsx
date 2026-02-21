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
        <div className="flex flex-col items-center justify-center min-h-dvh bg-[#0f172a] px-6 relative overflow-hidden">
            {/* Background elements synced with Account page */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                {/* Brand / Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-2xl mb-6 mx-auto">
                        <div className="h-full w-full rounded-[1.9rem] bg-[#0f172a] flex items-center justify-center border-2 border-[#0f172a]">
                            <span className="material-symbols-outlined text-white text-[38px] filled opacity-90">storefront</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        SuperMarket<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">AI</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Supermercado Inteligente</p>
                </div>

                {/* Form Container */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl shadow-black/20">
                    {/* Mode switcher - redesigned */}
                    <div className="flex rounded-2xl bg-black/20 p-1 mb-8">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "login"
                                ? "bg-white text-[#0f172a] shadow-lg"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); }}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "register"
                                ? "bg-white text-[#0f172a] shadow-lg"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === "register" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">person</span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre completo"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-black/30 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">alternate_email</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-black/30 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">lock_person</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-black/30 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-100 text-[11px] font-bold rounded-2xl p-4 animate-shake">
                                <span className="material-symbols-outlined text-[18px] text-red-400">gpp_maybe</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] font-black text-sm shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest mt-4"
                        >
                            {submitting ? (
                                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                            ) : mode === "login" ? (
                                "Iniciar Sesión"
                            ) : (
                                "Unirse ahora"
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer link */}
                <div className="text-center mt-10">
                    <p className="text-xs text-slate-500 font-bold tracking-tight">
                        {mode === "login" ? "¿Nuevo por aquí? " : "¿Ya eres parte? "}
                        <button
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                            className="text-primary font-black ml-1 hover:underline underline-offset-4"
                        >
                            {mode === "login" ? "Crea una cuenta" : "Inicia sesión"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
