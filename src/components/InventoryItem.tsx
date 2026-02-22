"use client";

import type { Product } from "@/lib/types";

interface InventoryItemProps {
    product: Product;
    onToggleStock: (productId: number, newStatus: boolean) => void;
    onEdit?: (product: Product) => void;
}

export default function InventoryItem({ product, onToggleStock, onEdit }: InventoryItemProps) {
    const taxLabel = product.taxType === "exento" ? "Exento" : "IVA 16%";
    const taxColor = product.taxType === "exento" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10";

    return (
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all">
            {/* Gradient accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-emerald-400 rounded-l-2xl" />

            <div className="flex items-center gap-4 ml-2">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white truncate">{product.name}</h3>
                        {product.sku && (
                            <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                {product.sku}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 capitalize">{product.category}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${taxColor}`}>
                            {taxLabel}
                        </span>
                    </div>

                    {/* Prices */}
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-extrabold text-primary tabular-nums">
                            ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.priceVes && (
                            <span className="text-xs text-slate-500 tabular-nums">
                                Bs. {parseFloat(product.priceVes).toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Edit button */}
                {onEdit && (
                    <button
                        onClick={() => onEdit(product)}
                        className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">edit</span>
                    </button>
                )}

                {/* Stock toggle */}
                <button
                    onClick={() => onToggleStock(product.id, !product.inStock)}
                    className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${product.inStock
                        ? "bg-primary shadow-[0_0_10px_rgba(19,236,91,0.3)]"
                        : "bg-slate-700"
                        }`}
                >
                    <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${product.inStock ? "left-[22px]" : "left-0.5"
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}
