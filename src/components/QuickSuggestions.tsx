"use client";

import type { Product } from "@/lib/types";

interface QuickSuggestionsProps {
    readonly products: Product[];
    readonly onSelect?: (name: string) => void;
}

export default function QuickSuggestions({ products, onSelect }: QuickSuggestionsProps) {
    if (!products.length) return null;

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
            {products.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelect?.(item.name)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-transform active:scale-95 hover:border-primary/40"
                >
                    <span className="text-xs font-semibold text-text-main">{item.name}</span>
                    <span className="text-[11px] text-text-secondary">{item.price}€</span>
                    <span className="text-[10px] text-gray-400">+</span>
                </button>
            ))}
        </div>
    );
}
