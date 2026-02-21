"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import type { Category, Product } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";

// Category card images
const categoryImages: Record<string, string> = {
  carnes: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTuG0qYnf0YyU_vYmtzPp9CrtL8HTFPi4v2vLqCOoKewZyVBUTC2iK32d0ppiccaGznmb-oVlOWl23N2vjdVj03jtQubVpae3QcjeXHucPPLfs_icoHBLItqRRjjnsunUueGPxYCbmGsQOYQacH7VoS66G1jInId8cF6QaqQLdSN8q3QafoONh1STXdoxk_z6RoNbgkuMRMKaLRNGpxDCApFNR8IlWAqZXNKhxqHElFBkzRY8FLmGeGDYLlxpcGDCpcdknYXR5Xr4_",
  charcutería: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNZX_popegsUEwVF7SygUQ7H78B6o6sGG8vkd8d2R8rmwInKuxfVkQtPwV2IrOFzeLbD7biDcCUqK6FVisSb88m0O_qF58iCwPdh0egsherGHnQDWenbHIxdi_MBFzeetxjTNFFRmOqEy5xD0Wq1Gpnpb1Xc84UernUpjq79OdfvQMFJa0gFjyYt4ltD3X21kO4GzBDldUqBRnKZUA7aWTR9NHtK7ewKIa3d0oEPWOTBCE6ltc3_WTxBnXpzASkrYgwcrCvEGhdvOo",
  preparados: "https://lh3.googleusercontent.com/aida-public/AB6AXuAex6ZUDh4Mv7YUU9gtl3qUpPoFJmgYheh0i7tqr6Sqc7a6s30NSyxSGe62QvmqDetSfVO0lonwUIp4wBhFLmJJPYUPUi8vdNhwjWSxwQI6VPE_npuCZ5AiNddJ7u6VL2GqusR3NA-xslWK54vXROeIixL-jkHcUV7C57CxDMENvYkuETqxbZz4PFiA5cH82KYYAvl57l1AW8Qfk1CE-RqVXlgHqy1Y2BK_jn8uwVULw5KFpSyqESNvs0iDc4F46c4B0GTPo9yr5Eo1",
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Out of stock state
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);

  // Favorites state
  const { favoriteProducts, favorites, toggleFavorite, isFavorite } = useFavorites();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Parallel fetch for categories and out-of-stock count/products
    Promise.all([
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/products/out-of-stock").then((res) => res.json())
    ]).then(([catData, stockData]) => {
      setCategories(catData.categories || []);
      if (stockData.products) {
        setOutOfStockProducts(stockData.products);
        setOutOfStockCount(stockData.products.length);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-[#f8fafc]">
      {/* Hero Header with Premium Dark Slate Sync - Fixed overflow to allow dropdown */}
      <header className="relative pt-16 pb-12 shadow-[0_10px_40px_-15px_rgba(15,23,42,0.3)]">
        {/* Background Blobs - Synced with Account & Login - Moved overflow here */}
        <div className="absolute inset-0 bg-[#0f172a] pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] h-[250px] w-[250px] rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-full bg-[#1e293b]/50 skew-y-6" />
        </div>

        <div className="relative z-20 px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1.5 opacity-80">BIENVENIDO DE NUEVO 👋</p>
              <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
                Carnicería <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">IA</span>
              </h1>
            </div>

            <div className="flex gap-3">
              {/* Out of Stock Badge */}
              {outOfStockCount > 0 && (
                <button
                  onClick={() => setShowOutOfStockModal(true)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:bg-white/10 active:scale-90"
                >
                  <span className="material-symbols-outlined text-red-400 text-[24px]">production_quantity_limits</span>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-red-500 border-2 border-[#0f172a] text-[10px] font-black text-white">
                    {outOfStockCount}
                  </span>
                </button>
              )}

              {/* Favorites Badge */}
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:bg-white/10 active:scale-90"
              >
                <span className={`material-symbols-outlined text-[24px] ${favorites.length > 0 ? "text-rose-500 fill-current" : "text-white opacity-80"}`}>favorite</span>
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500 border-2 border-[#0f172a] text-[10px] font-black text-white">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - Redesigned with refined glassmorphism */}
          <div ref={searchRef} className="relative group">
            <div className={`flex items-center gap-4 rounded-[1.8rem] bg-white/5 backdrop-blur-2xl border border-white/10 p-2 shadow-2xl transition-all duration-500 ${showResults ? 'ring-2 ring-primary/50 bg-white/10' : 'group-hover:bg-white/10 group-hover:border-white/20'}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-[#0f172a] flex-shrink-0 shadow-lg group-focus-within:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-[24px] filled">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                placeholder="Busca tu corte preferido..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-slate-500 font-bold outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 transition-colors mr-1"
                >
                  <span className="material-symbols-outlined text-white/50 text-[20px]">close</span>
                </button>
              )}
            </div>

            {/* Search Results Dropdown - Full Redesign */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-4 rounded-[2.5rem] bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] border border-slate-100 z-50 max-h-[400px] overflow-hidden animate-slide-up">
                {/* ... dropdown content ... */}
                {searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-slate-200 text-[40px]">manage_search</span>
                    </div>
                    <p className="text-lg font-black text-slate-800 tracking-tight">Sin resultados</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Intenta con otro corte o categoría</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                      {searchResults.length} coincidencia{searchResults.length !== 1 ? "s" : ""} encontrada{searchResults.length !== 1 ? "s" : ""}
                    </p>
                    <div className="px-2 space-y-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/chat/${encodeURIComponent(product.category)}`}
                          onClick={() => setShowResults(false)}
                          className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-all rounded-[1.8rem] group/item border border-transparent hover:border-slate-100"
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0 shadow-inner ${product.inStock ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            <span className={`material-symbols-outlined text-[24px] ${product.inStock ? 'text-emerald-600' : 'text-red-400'}`}>
                              {product.inStock ? "inventory_2" : "inventory"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-black tracking-tight ${product.inStock ? 'text-slate-800' : 'text-slate-400'}`}>{product.name}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(product);
                              }}
                              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors group/fav"
                            >
                              <span className={`material-symbols-outlined text-[20px] transition-all group-hover/fav:scale-125 ${isFavorite(product.id) ? "text-rose-500 fill-current animate-bounce-short" : "text-slate-200 group-hover/fav:text-rose-300"}`}>favorite</span>
                            </button>
                            <div className="text-right flex flex-col items-end gap-0.5">
                              <p className="text-base font-black text-emerald-600 tabular-nums">
                                {Number(product.price).toFixed(2)} €
                              </p>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${product.inStock ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                {product.inStock ? "Stock" : "Agotado"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Refined Layout */}
      <main className="flex-1 px-6 py-10 pb-32 space-y-12 -mt-4 relative z-10">

        {/* Categories Section - Redesigned Cards */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Categorías</h2>
            <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {categories.length} Secciones
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-52 rounded-[2.5rem] skeleton-shimmer shadow-sm" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/chat/${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 active:scale-95"
                >
                  <div className="h-28 w-full overflow-hidden bg-slate-50 relative">
                    {categoryImages[cat.name.toLowerCase()] ? (
                      <img
                        src={categoryImages[cat.name.toLowerCase()]}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-50 to-slate-100">
                        {cat.emoji}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="p-4 pt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                        {cat.emoji}
                      </div>
                      <h3 className="text-sm font-black text-slate-800 capitalize tracking-tight">{cat.name}</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2 uppercase tracking-tighter">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Action Menu - Redesigned matching Account page */}
        <section>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6 px-1">Atajos</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/orders" className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-500 active:scale-90">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-emerald-50 text-emerald-600 transition-all group-hover:bg-emerald-500 group-hover:text-white group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-emerald-200">
                <span className="material-symbols-outlined text-[28px] filled">receipt_long</span>
              </div>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Pedidos</span>
            </Link>

            <Link href="/favorites" className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all duration-500 active:scale-90">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-rose-50 text-rose-500 transition-all group-hover:bg-rose-500 group-hover:text-white group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-rose-200">
                <span className="material-symbols-outlined text-[28px] filled">favorite</span>
              </div>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Favoritos</span>
            </Link>

            <Link href="/account" className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-500 active:scale-90">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-indigo-50 text-indigo-600 transition-all group-hover:bg-indigo-500 group-hover:text-white group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-indigo-200">
                <span className="material-symbols-outlined text-[28px] filled">person</span>
              </div>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Cuenta</span>
            </Link>
          </div>
        </section>

        {/* Premium Promo Banner synced with Login style */}
        <section>
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-2xl flex flex-col items-center text-center">
            {/* Animated Glow Orbs */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

            <div className="relative z-10 w-full">
              <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 inline-block mb-6 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">IA Voice Experience</span>
                </div>
              </div>

              <h3 className="text-3xl font-black text-white tracking-tighter mb-4 leading-none">Ordena con tu voz</h3>
              <p className="text-sm text-slate-400 font-medium mb-8 max-w-[280px] mx-auto leading-relaxed">Dile a nuestra IA lo que necesitas y nosotros nos encargamos del resto.</p>

              <Link href="/chat/carnes" className="group flex items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-primary to-emerald-400 p-1 pr-6 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                <div className="h-12 w-12 rounded-full bg-[#0f172a] flex items-center justify-center text-white shadow-lg group-hover:rotate-[360deg] duration-700 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                </div>
                <span className="text-sm font-black text-[#0f172a] uppercase tracking-widest pl-1">Probar ahora</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <NavBar variant="customer" />

      {/* Out of Stock Modal */}
      {showOutOfStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOutOfStockModal(false)} />
          <div className="relative w-full max-w-md bg-[#0f172a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Sin Stock</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Disponibles bajo pedido</p>
              </div>
              <button
                onClick={() => setShowOutOfStockModal(false)}
                className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {outOfStockProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-slate-700 text-[40px] mb-2">inventory_2</span>
                  <p className="text-slate-500 font-bold text-sm">Todo en inventario</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {outOfStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="h-12 w-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined">inventory</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">{Number(product.price).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5">
              <button
                onClick={() => setShowOutOfStockModal(false)}
                className="w-full py-4 rounded-2xl bg-white text-[#0f172a] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFavoritesModal(false)} />
          <div className="relative w-full max-w-md bg-[#0f172a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Mis Favoritos</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{favoriteProducts.length} productos guardados</p>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {favoriteProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-rose-500/20 text-[40px] mb-2 filled">favorite</span>
                  <p className="text-slate-500 font-bold text-sm">No tienes favoritos aún</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <span className="material-symbols-outlined filled">favorite</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{product.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">{Number(product.price).toFixed(2)} €</p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(product)}
                          className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5">
              <Link
                href="/chat/carnes"
                onClick={() => setShowFavoritesModal(false)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                Pedir mis favoritos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
