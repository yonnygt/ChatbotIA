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
    <div className="flex flex-col min-h-dvh bg-background-light">
      {/* Hero Header */}
      <header className="relative pt-14 pb-10">
        {/* Background blobs (contained to avoid overflow on main page, but allows dropdown to overflow header content) */}
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background-dark via-surface-dark to-background-dark pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-[80px] animate-float" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/15 blur-[60px] animate-float" style={{ animationDelay: "3s" }} />
          <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-primary/10 blur-[40px]" />
        </div>

        <div className="relative z-20 px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-primary/80">¡Buenos días! 👋</p>
              <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
                Carnicería <span className="text-gradient">IA</span>
              </h1>
            </div>

            <div className="flex gap-3">
              {/* Out of Stock Badge */}
              {outOfStockCount > 0 && (
                <button
                  onClick={() => setShowOutOfStockModal(true)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl glass-dark border border-white/10 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-red-400 text-[22px]">production_quantity_limits</span>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-background-dark text-[10px] font-bold text-white">
                    {outOfStockCount}
                  </span>
                </button>
              )}

              {/* Favorites Badge */}
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl glass-dark border border-white/10 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <span className={`material-symbols-outlined text-[22px] ${favorites.length > 0 ? "text-red-400 fill-current" : "text-white"}`}>favorite</span>
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-background-dark text-[10px] font-bold text-white">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* Cart Badge (visual only for now) */}
              <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl glass-dark border border-white/10 shadow-lg transition-transform hover:scale-105 active:scale-95">
                <span className="material-symbols-outlined text-white text-[22px]">shopping_bag</span>
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background-dark" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative">
            <div className={`flex items-center gap-3 rounded-2xl glass-dark border border-white/10 p-3 shadow-lg transition-all ${showResults ? 'ring-2 ring-primary/50 bg-surface-dark' : ''}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                placeholder="¿Qué necesitas hoy?"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-text-light/50 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-text-light/50 text-[18px]">close</span>
                </button>
              )}
              {searching && (
                <span className="material-symbols-outlined text-primary text-[20px] animate-spin">progress_activity</span>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-gray-100 shadow-elevated z-50 max-h-[320px] overflow-y-auto ring-1 ring-black/5">
                {/* ... existing dropdown content ... */}
                {searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <span className="material-symbols-outlined text-gray-300 text-[32px] mb-2">search_off</span>
                    <p className="text-sm font-medium text-text-main">Sin resultados</p>
                    <p className="text-xs text-text-secondary mt-1">No encontramos productos que coincidan con &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-50">
                      {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
                    </p>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/chat/${encodeURIComponent(product.category)}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${product.inStock ? 'bg-primary/10' : 'bg-red-50'}`}>
                          <span className={`material-symbols-outlined text-[20px] ${product.inStock ? 'text-primary' : 'text-red-400'}`}>
                            {product.inStock ? "inventory_2" : "inventory"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${product.inStock ? 'text-text-main' : 'text-text-secondary'}`}>{product.name}</p>
                          <p className="text-[11px] text-text-secondary capitalize">{product.category}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(product);
                            }}
                            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <span className={`material-symbols-outlined text-[18px] ${isFavorite(product.id) ? "text-red-500 fill-current" : "text-gray-300"}`}>favorite</span>
                          </button>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-extrabold text-primary-dark">
                              {Number(product.price).toFixed(2)} €
                            </p>
                            <p className={`text-[10px] font-bold ${product.inStock ? "text-green-600" : "text-red-500"}`}>
                              {product.inStock ? "✓ Disponible" : "✗ Agotado"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Out of Stock Modal */}
      {showOutOfStockModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowOutOfStockModal(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">production_quantity_limits</span>
                </div>
                <h3 className="text-base font-bold text-text-main">Productos Agotados</h3>
              </div>
              <button onClick={() => setShowOutOfStockModal(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {outOfStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-secondary">No hay productos agotados actualmente.</p>
                </div>
              ) : (
                outOfStockProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover grayscale" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl grayscale">🥩</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-main/80">{product.name}</h4>
                      <p className="text-xs text-text-secondary capitalize">{product.category}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                      Agotado
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-text-secondary">Estos productos no están disponibles para ordenar por el momento.</p>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowFavoritesModal(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">favorite</span>
                </div>
                <h3 className="text-base font-bold text-text-main">Mis Favoritos</h3>
              </div>
              <button onClick={() => setShowFavoritesModal(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2">favorite_border</span>
                  <p className="text-sm text-text-secondary">No tienes favoritos aún.</p>
                  <p className="text-xs text-text-secondary/60 mt-1">Dale ❤️ a los productos que te gusten.</p>
                </div>
              ) : (
                favoriteProducts.map(product => (
                  <Link href={`/chat/${encodeURIComponent(product.category)}`} key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors" onClick={() => setShowFavoritesModal(false)}>
                    <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl">🥩</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-main/80">{product.name}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-text-secondary capitalize">{product.category}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {product.inStock ? "Stock" : "Agotado"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px] text-red-500 fill-current">favorite</span>
                    </button>
                  </Link>
                ))
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-text-secondary">Toca un producto para pedirlo.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 pb-28 space-y-8 -mt-2">
        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Secciones</h2>
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
              {categories.length} disponibles
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/chat/${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100/80 transition-all duration-300 hover:shadow-elevated hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  <div className="h-24 w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                    {categoryImages[cat.name.toLowerCase()] ? (
                      <img
                        src={categoryImages[cat.name.toLowerCase()]}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-4xl">{cat.emoji}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent h-24" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{cat.emoji}</span>
                      <h3 className="text-sm font-bold text-text-main capitalize">{cat.name}</h3>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight">{cat.description}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-1">
                    <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-text-main mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/orders" className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 shadow-sm border border-gray-100/80 hover:border-primary/30 hover:shadow-elevated transition-all duration-300 active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              </div>
              <span className="text-xs font-bold text-text-main">Mis Pedidos</span>
            </Link>
            <Link href="/favorites" className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 shadow-sm border border-gray-100/80 hover:border-primary/30 hover:shadow-elevated transition-all duration-300 active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-[24px]">favorite</span>
              </div>
              <span className="text-xs font-bold text-text-main">Favoritos</span>
            </Link>
            <Link href="/orders" className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 shadow-sm border border-gray-100/80 hover:border-primary/30 hover:shadow-elevated transition-all duration-300 active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
              </div>
              <span className="text-xs font-bold text-text-main">Historial</span>
            </Link>
          </div>
        </section>

        {/* Promo Banner */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background-dark via-surface-dark to-background-dark p-6 border border-primary/10">
            {/* Animated orb */}
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-primary/15 blur-2xl animate-float" />
            <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-primary/10 blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Nuevo
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-2">Pide por voz con IA</h3>
              <p className="text-sm text-text-light/60 mt-1.5 leading-relaxed">Solo di lo que necesitas y nuestro carnicero IA lo prepara al instante.</p>
              <Link href="/chat/carnes" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-background-dark shadow-glow hover:brightness-110 transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]">mic</span>
                Probar ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      <NavBar variant="customer" />
    </div>
  );
}
