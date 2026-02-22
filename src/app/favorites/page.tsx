"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function FavoritesPage() {
    const router = useRouter();
    const { user, loading: authLoading, fetchUser } = useAuth();
    const { favoriteProducts, loading: favsLoading, toggleFavorite } = useFavorites();

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
        }
    }, [user, authLoading, router]);

    const loading = authLoading || favsLoading;

    if (loading) {
        return (
            <div className="flex flex-col min-h-dvh bg-[#f8fafc]">
                <header className="px-5 pt-12 pb-4">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Favoritos</h1>
                    <p className="text-sm text-slate-500 mt-1">Tus productos guardados</p>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/40 text-[48px] animate-spin">
                        progress_activity
                    </span>
                </main>
                <NavBar variant="customer" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-dvh bg-[#f8fafc]">
            <header className="px-5 pt-12 pb-4">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Favoritos</h1>
                <p className="text-sm text-slate-500 mt-1">
                    {favoriteProducts.length > 0
                        ? `${favoriteProducts.length} producto${favoriteProducts.length !== 1 ? "s" : ""} guardado${favoriteProducts.length !== 1 ? "s" : ""}`
                        : "Tus productos guardados"
                    }
                </p>
            </header>

            <main className="flex-1 px-5 pb-32">
                {favoriteProducts.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full -mt-12">
                        <div className="text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-50 mx-auto mb-5">
                                <span className="material-symbols-outlined text-rose-300 text-[48px] filled">favorite</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Aún no tienes favoritos</h2>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                                Cuando explores productos en el chat, toca el corazón para guardarlos aquí.
                            </p>
                            <Link
                                href="/"
                                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 px-6 py-3 text-xs font-black text-[#0f172a] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">storefront</span>
                                Explorar Productos
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Favorites List */
                    <div className="space-y-3 mt-4">
                        {favoriteProducts.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center gap-4 p-4 rounded-[2rem] bg-white border border-slate-100 shadow-lg shadow-slate-200/30 transition-all hover:shadow-xl"
                            >
                                {/* Product Icon */}
                                <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] flex-shrink-0 shadow-inner ${product.inStock ? "bg-emerald-50" : "bg-red-50"}`}>
                                    <span className={`material-symbols-outlined text-[28px] ${product.inStock ? "text-emerald-600" : "text-red-400"}`}>
                                        {product.inStock ? "inventory_2" : "inventory"}
                                    </span>
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{product.category}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-sm font-black text-emerald-600 tabular-nums">
                                            {Number(product.price).toFixed(2)} €
                                        </span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${product.inStock
                                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                            : "bg-red-50 border-red-100 text-red-500"
                                            }`}>
                                            {product.inStock ? "Disponible" : "Agotado"}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {product.inStock && (
                                        <Link
                                            href={`/chat/${encodeURIComponent(product.category)}`}
                                            className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => toggleFavorite(product)}
                                        className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <NavBar variant="customer" />
        </div>
    );
}
