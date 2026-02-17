"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import type { Category } from "@/lib/types";

// Category card images
const categoryImages: Record<string, string> = {
  carnes: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTuG0qYnf0YyU_vYmtzPp9CrtL8HTFPi4v2vLqCOoKewZyVBUTC2iK32d0ppiccaGznmb-oVlOWl23N2vjdVj03jtQubVpae3QcjeXHucPPLfs_icoHBLItqRRjjnsunUueGPxYCbmGsQOYQacH7VoS66G1jInId8cF6QaqQLdSN8q3QafoONh1STXdoxk_z6RoNbgkuMRMKaLRNGpxDCApFNR8IlWAqZXNKhxqHElFBkzRY8FLmGeGDYLlxpcGDCpcdknYXR5Xr4_",
  charcutería: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNZX_popegsUEwVF7SygUQ7H78B6o6sGG8vkd8d2R8rmwInKuxfVkQtPwV2IrOFzeLbD7biDcCUqK6FVisSb88m0O_qF58iCwPdh0egsherGHnQDWenbHIxdi_MBFzeetxjTNFFRmOqEy5xD0Wq1Gpnpb1Xc84UernUpjq79OdfvQMFJa0gFjyYt4ltD3X21kO4GzBDldUqBRnKZUA7aWTR9NHtK7ewKIa3d0oEPWOTBCE6ltc3_WTxBnXpzASkrYgwcrCvEGhdvOo",
  preparados: "https://lh3.googleusercontent.com/aida-public/AB6AXuAex6ZUDh4Mv7YUU9gtl3qUpPoFJmgYheh0i7tqr6Sqc7a6s30NSyxSGe62QvmqDetSfVO0lonwUIp4wBhFLmJJPYUPUi8vdNhwjWSxwQI6VPE_npuCZ5AiNddJ7u6VL2GqusR3NA-xslWK54vXROeIixL-jkHcUV7C57CxDMENvYkuETqxbZz4PFiA5cH82KYYAvl57l1AW8Qfk1CE-RqVXlgHqy1Y2BK_jn8uwVULw5KFpSyqESNvs0iDc4F46c4B0GTPo9yr5Eo1",
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-background-light">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary-light to-background-light px-6 pt-14 pb-8">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-text-secondary">¡Buenos días! 👋</p>
              <h1 className="text-2xl font-bold text-text-main mt-0.5">Carnicería IA</h1>
            </div>
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
              <span className="material-symbols-outlined text-text-main text-[22px]">shopping_bag</span>
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm p-3.5 shadow-sm border border-white/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary-dark">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <p className="text-sm text-text-secondary">¿Qué necesitas hoy?</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 pb-28 space-y-8">
        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Secciones</h2>
            <span className="text-xs font-medium text-text-secondary">
              {categories.length} disponibles
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/chat/${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.97]"
                >
                  <div className="h-24 w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                    {categoryImages[cat.name.toLowerCase()] ? (
                      <img
                        src={categoryImages[cat.name.toLowerCase()]}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">{cat.emoji}</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent h-24" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{cat.emoji}</span>
                      <h3 className="text-sm font-bold text-text-main capitalize">{cat.name}</h3>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight">{cat.description}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-primary-dark text-[16px]">arrow_forward</span>
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
            <Link href="/orders" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary-dark text-[24px]">receipt_long</span>
              </div>
              <span className="text-xs font-semibold text-text-main">Mis Pedidos</span>
            </Link>
            <Link href="/favorites" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary-dark text-[24px]">favorite</span>
              </div>
              <span className="text-xs font-semibold text-text-main">Favoritos</span>
            </Link>
            <Link href="/orders" className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors active:scale-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary-dark text-[24px]">schedule</span>
              </div>
              <span className="text-xs font-semibold text-text-main">Historial</span>
            </Link>
          </div>
        </section>

        {/* Promo Banner */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-dark p-5">
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Oferta del día</p>
              <h3 className="text-lg font-bold text-white mt-1">Pide por voz con IA</h3>
              <p className="text-sm text-white/80 mt-1">Solo di lo que necesitas y nuestro carnicero IA lo prepara.</p>
              <Link href="/chat/carnes" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-primary-dark shadow-sm hover:brightness-95 transition-all">
                <span className="material-symbols-outlined text-[16px]">mic</span>
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
