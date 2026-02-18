"use client";

import type { Product } from "@/lib/types";
import Image from "next/image";

interface ProductCardProps {
    product: Product;
    onAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
            {/* Image */}
            <div className="relative h-32 bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-gray-300 text-[48px]">inventory_2</span>
                    </div>
                )}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-lg">Agotado</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="text-sm font-bold text-gray-800 truncate">{product.name}</h3>
                <p className="text-xs text-secondary-text capitalize mt-0.5">{product.category}</p>

                <div className="flex items-end justify-between mt-2">
                    <div>
                        <p className="text-base font-extrabold text-primary tabular-nums">
                            ${parseFloat(product.price).toFixed(2)}
                            <span className="text-[10px] font-medium text-secondary-text ml-1">/{product.unit}</span>
                        </p>
                        {product.priceVes && (
                            <p className="text-[11px] text-secondary-text tabular-nums">
                                Bs. {parseFloat(product.priceVes).toFixed(2)}
                            </p>
                        )}
                    </div>
                    {onAdd && product.inStock && (
                        <button
                            onClick={() => onAdd(product)}
                            className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-glow hover:brightness-110 active:scale-90 transition-all"
                        >
                            <span className="material-symbols-outlined text-background-dark text-[18px]">add</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
