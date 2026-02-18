"use client";

import NavBar from "@/components/NavBar";

export default function FavoritesPage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background-light">
            <header className="px-5 pt-12 pb-4">
                <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Favoritos</h1>
                <p className="text-sm text-text-secondary mt-1">Tus pedidos guardados para reordenar rápido</p>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-8 -mt-12">
                <div className="text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/8 mx-auto mb-5">
                        <span className="material-symbols-outlined text-primary/40 text-[48px]">favorite</span>
                    </div>
                    <h2 className="text-lg font-bold text-text-main">Aún no tienes favoritos</h2>
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-xs mx-auto">
                        Guarda tus pedidos favoritos para repetirlos con un solo toque.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary-dark">
                        <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                        Próximamente disponible
                    </div>
                </div>
            </main>

            <NavBar variant="customer" />
        </div>
    );
}
