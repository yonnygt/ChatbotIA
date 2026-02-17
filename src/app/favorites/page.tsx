"use client";

import NavBar from "@/components/NavBar";

export default function FavoritesPage() {
    return (
        <div className="flex flex-col min-h-dvh pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 pt-14 pb-4">
                <h1 className="text-2xl font-bold text-text-main dark:text-white">
                    Mis Pedidos Favoritos
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Repite tus pedidos habituales con un toque
                </p>
            </header>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[64px] mb-4">
                    favorite
                </span>
                <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                    Sin favoritos aún
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1 max-w-xs">
                    Cuando hagas pedidos, podrás guardarlos como favoritos para repetirlos fácilmente
                </p>
            </div>

            <NavBar variant="customer" />
        </div>
    );
}
