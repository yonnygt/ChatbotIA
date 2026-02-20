"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
import InventoryItem from "@/components/InventoryItem";
import ProductFormModal from "@/components/ProductFormModal";
import ToastNotification from "@/components/ToastNotification";
import type { Product } from "@/lib/types";

const CATEGORIES = ["res", "cerdo", "pollo", "charcutería", "otros"];

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined);
    // undefined = modal closed, null = new product, Product = editing

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : data.products || []);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleToggleStock = async (productId: number, inStock: boolean) => {
        try {
            await fetch("/api/products/toggle-stock", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, inStock }),
            });
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, inStock } : p))
            );
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast(
                    inStock ? "Producto disponible ✅" : "Producto agotado",
                    inStock ? "success" : "warning"
                );
            }
        } catch {
            if (typeof window !== "undefined" && (window as any).__addToast) {
                (window as any).__addToast("Error al actualizar stock", "warning");
            }
        }
    };

    const outOfStockCount = products.filter((p) => !p.inStock).length;

    const filteredProducts = products.filter((p) => {
        if (showOutOfStock) return !p.inStock;
        if (selectedCategory !== "all" && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        }
        return true;
    });

    return (
        <div className="flex flex-col min-h-dvh bg-[#f3f6f4] text-gray-800">
            <ToastNotification />

            {/* Header */}
            <header className="px-5 pt-12 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-primary-dark/70 uppercase tracking-wider">Gestión</p>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">Inventario</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {outOfStockCount > 0 && (
                            <button
                                onClick={() => {
                                    setShowOutOfStock(!showOutOfStock);
                                    setSelectedCategory("all");
                                }}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all ${showOutOfStock
                                    ? "bg-red-500 text-white border-red-600 shadow-md"
                                    : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[14px] ${showOutOfStock ? "text-white" : "text-red-400"}`}>warning</span>
                                <span className="text-xs font-bold">{outOfStockCount} agotados</span>
                            </button>
                        )}
                        <button
                            onClick={() => setModalProduct(null)}
                            className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-soft hover:brightness-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-white text-[22px]">add</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Title for filter mode */}
            {showOutOfStock && (
                <div className="px-5 mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-red-500">Productos Agotados</h2>
                    <button onClick={() => setShowOutOfStock(false)} className="text-xs text-gray-400 hover:text-gray-700 underline">
                        Ver todo
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="px-5 mb-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Category filters */}
            <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory("all")}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${selectedCategory === "all"
                        ? "bg-primary text-white shadow-soft"
                        : "bg-white text-gray-500 border border-gray-200 hover:border-primary/30"
                        }`}
                >
                    Todos
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold capitalize transition-all duration-200 ${selectedCategory === cat
                            ? "bg-primary text-white shadow-soft"
                            : "bg-white text-gray-500 border border-gray-200 hover:border-primary/30"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Products list */}
            <main className="flex-1 px-5 pb-28 space-y-2.5">
                {loading ? (
                    <div className="space-y-2.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 mb-4">
                            <span className="material-symbols-outlined text-gray-300 text-[40px]">inventory_2</span>
                        </div>
                        <p className="text-base font-bold text-gray-800">Sin resultados</p>
                        <p className="text-sm text-gray-400 mt-1">Intenta con otra búsqueda o categoría</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <InventoryItem
                            key={product.id}
                            product={product}
                            onToggleStock={handleToggleStock}
                            onEdit={(p) => setModalProduct(p)}
                        />
                    ))
                )}
            </main>

            {/* Product form modal */}
            {modalProduct !== undefined && (
                <ProductFormModal
                    product={modalProduct}
                    onClose={() => setModalProduct(undefined)}
                    onSaved={() => {
                        fetchProducts();
                        if (typeof window !== "undefined" && (window as any).__addToast) {
                            (window as any).__addToast(
                                modalProduct ? "Producto actualizado ✅" : "Producto creado ✅",
                                "success"
                            );
                        }
                    }}
                />
            )}

            <NavBar variant="staff" />
        </div>
    );
}
