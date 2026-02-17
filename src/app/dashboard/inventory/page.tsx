"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import InventoryItem from "@/components/InventoryItem";
import type { Product } from "@/lib/types";

export default function InventoryPage() {
    const [activeCategory, setActiveCategory] = useState("Todo");
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/products");
                if (res.ok) {
                    const data = await res.json();
                    const productsList = data.products || data;
                    setProducts(productsList);
                    // Extract unique categories
                    const cats = [...new Set(productsList.map((p: Product) => p.category))] as string[];
                    setCategories(cats);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const filtered = products.filter((p) => {
        const matchCategory =
            activeCategory === "Todo" ||
            p.category.toLowerCase() === activeCategory.toLowerCase();
        const matchSearch =
            !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.includes(search));
        return matchCategory && matchSearch;
    });

    const outOfStock = products.filter((p) => !p.inStock).length;

    const handleToggleStock = async (product: Product) => {
        // Optimistic update
        setProducts((prev) =>
            prev.map((p) =>
                p.id === product.id ? { ...p, inStock: !p.inStock } : p
            )
        );

        try {
            await fetch("/api/products/toggle-stock", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, inStock: !product.inStock }),
            });
        } catch (error) {
            console.error("Error toggling stock:", error);
            // Revert on error
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === product.id ? { ...p, inStock: product.inStock } : p
                )
            );
        }
    };

    const categoryIcons: Record<string, string> = {
        "Todo": "grid_view",
        "carnes": "lunch_dining",
        "charcutería": "bakery_dining",
        "preparados": "skillet",
        "quesos": "egg",
        "bebidas": "local_cafe",
    };

    const allCategories = ["Todo", ...categories];

    return (
        <div className="flex flex-col min-h-dvh pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-white">
                            Inventario
                        </h1>
                        <p className="text-sm text-text-secondary mt-0.5">
                            {products.length} productos • {outOfStock} sin stock
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark px-4 py-2.5 mb-4">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="flex-1 bg-transparent text-sm text-text-main dark:text-white placeholder:text-gray-400 outline-none"
                    />
                </div>

                {/* Out-of-stock alert */}
                {outOfStock > 0 && (
                    <div className="flex items-center gap-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 p-3 mb-4">
                        <span className="material-symbols-outlined text-red-400 text-[20px]">
                            warning
                        </span>
                        <p className="text-xs text-red-400 font-medium">
                            {outOfStock} producto{outOfStock > 1 ? "s" : ""} sin stock
                        </p>
                    </div>
                )}

                {/* Category filters */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {allCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors capitalize ${activeCategory === cat
                                ? "bg-primary text-text-main shadow-soft"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">
                                {categoryIcons[cat.toLowerCase()] || "category"}
                            </span>
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Product list */}
            <div className="flex flex-col gap-3 p-4">
                {loading ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px] mb-4 animate-spin">
                            progress_activity
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            Cargando inventario...
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[64px] mb-4">
                            inventory_2
                        </span>
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                            Sin resultados
                        </p>
                    </div>
                ) : (
                    filtered.map((product) => (
                        <InventoryItem
                            key={product.id}
                            product={product}
                            onToggleStock={handleToggleStock}
                        />
                    ))
                )}
            </div>

            <NavBar variant="staff" />
        </div>
    );
}
