"use client";

import type { Product } from "@/lib/types";

interface InventoryItemProps {
    product: Product;
    onToggleStock: (productId: number, newStatus: boolean) => void;
    onEdit?: (product: Product) => void;
}

export default function InventoryItem({ product, onToggleStock, onEdit }: InventoryItemProps) {
    return (
        <div className="relative bg-surface-dark rounded-2xl p-4 border border-white/5 overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-l-2xl" />

            <div className="flex items-center gap-4 ml-2">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-white truncate">{product.name}</h3>
                        {product.sku && (
                            <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                                {product.sku}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{product.category}</p>

                    {/* Prices */}
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-extrabold text-primary tabular-nums">
                            ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.priceVes && (
                            <span className="text-xs text-gray-400 tabular-nums">
                                Bs. {parseFloat(product.priceVes).toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Edit button */}
                {onEdit && (
                    <button
                        onClick={() => onEdit(product)}
                        className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                    >
                        <span className="material-symbols-outlined text-gray-400 text-[18px]">edit</span>
                    </button>
                )}

                {/* Stock toggle */}
                <button
                    onClick={() => onToggleStock(product.id, !product.inStock)}
                    className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${product.inStock
                        ? "bg-primary shadow-glow"
                        : "bg-gray-700"
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
