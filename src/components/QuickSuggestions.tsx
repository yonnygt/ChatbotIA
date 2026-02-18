import type { Product } from "@/lib/types";

interface QuickSuggestionsProps {
    readonly products: Product[];
    readonly onSelect: (product: Product) => void;
}

export default function QuickSuggestions({ products, onSelect }: QuickSuggestionsProps) {
    if (!products.length) return null;

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-2">
            {products.map((product) => (
                <button
                    key={product.id}
                    onClick={() => onSelect(product)}
                    className="flex items-center gap-2 shrink-0 rounded-full bg-white border border-gray-100/80 px-3.5 py-2 text-xs font-semibold text-text-main shadow-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 active:scale-95"
                >
                    <span className="text-sm">🥩</span>
                    <span>{product.name}</span>
                    <span className="text-text-secondary font-bold tabular-nums">{product.price}€</span>
                </button>
            ))}
        </div>
    );
}
