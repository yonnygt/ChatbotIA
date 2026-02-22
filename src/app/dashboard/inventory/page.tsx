"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
import InventoryItem from "@/components/InventoryItem";
import ProductFormModal from "@/components/ProductFormModal";
import ToastNotification from "@/components/ToastNotification";
import type { Product, Section } from "@/lib/types";


export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined);

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
        fetch("/api/sections")
            .then((r) => r.json())
            .then((d) => setSections(d.sections || []))
            .catch(() => { });
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
        if (selectedSection !== "all" && String(p.sectionId) !== selectedSection) return false;
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
        <div className="flex flex-col min-h-dvh bg-[#0f172a] text-slate-100 relative overflow-hidden">
            <ToastNotification />

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] bg-primary/6 rounded-full blur-[120px]" />
                <div className="absolute bottom-[30%] right-[-15%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 px-5 pt-14 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em]">Gestión</p>
                        <h1 className="text-2xl font-black text-white tracking-tight mt-1">Inventario</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {outOfStockCount > 0 && (
                            <button
                                onClick={() => {
                                    setShowOutOfStock(!showOutOfStock);
                                    setSelectedSection("all");
                                }}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all ${showOutOfStock
                                    ? "bg-red-500 text-white border-red-600 shadow-md"
                                    : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[14px] ${showOutOfStock ? "text-white" : "text-red-400"}`}>warning</span>
                                <span className="text-xs font-bold">{outOfStockCount} agotados</span>
                            </button>
                        )}
                        <button
                            onClick={() => setModalProduct(null)}
                            className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-emerald-400 flex items-center justify-center shadow-[0_4px_12px_rgba(19,236,91,0.25)] hover:brightness-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[#0f172a] text-[22px]">add</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Out of stock title */}
            {showOutOfStock && (
                <div className="relative z-10 px-5 mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-red-400">Productos Agotados</h2>
                    <button onClick={() => setShowOutOfStock(false)} className="text-xs text-slate-500 hover:text-slate-300 underline">
                        Ver todo
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative z-10 px-5 mb-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none font-medium"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Category filters */}
            <div className="relative z-10 flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setSelectedSection("all")}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${selectedSection === "all"
                        ? "bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] shadow-[0_4px_12px_rgba(19,236,91,0.25)]"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:border-primary/30 backdrop-blur-sm"
                        }`}
                >
                    Todos
                </button>
                {sections.map((sec) => (
                    <button
                        key={sec.id}
                        onClick={() => setSelectedSection(String(sec.id))}
                        className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${selectedSection === String(sec.id)
                            ? "bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] shadow-[0_4px_12px_rgba(19,236,91,0.25)]"
                            : "bg-white/5 text-slate-400 border border-white/10 hover:border-primary/30 backdrop-blur-sm"
                            }`}
                    >
                        {sec.emoji} {sec.name}
                    </button>
                ))}
            </div>

            {/* Products list */}
            <main className="relative z-10 flex-1 px-5 pb-28 space-y-2.5">
                {loading ? (
                    <div className="space-y-2.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 mb-4">
                            <span className="material-symbols-outlined text-slate-500 text-[40px]">inventory_2</span>
                        </div>
                        <p className="text-base font-bold text-white">Sin resultados</p>
                        <p className="text-sm text-slate-500 mt-1">Intenta con otra búsqueda o categoría</p>
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
