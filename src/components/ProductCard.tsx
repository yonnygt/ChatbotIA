import type { Product } from "@/lib/types";

interface ProductCardProps {
    readonly product: Product;
    readonly onAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-background-light dark:bg-background-dark p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                {product.imageUrl ? (
                    <img
                        className="h-full w-full object-cover"
                        src={product.imageUrl}
                        alt={product.name}
                    />
                ) : (
                    <span className="material-symbols-outlined text-gray-400 text-[24px]">inventory_2</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-text-main dark:text-white">
                    {product.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                    {product.description || ""}
                </p>
                <p className="text-sm font-bold text-primary-dark dark:text-primary mt-1">
                    {parseFloat(String(product.price)).toFixed(2)} €/{product.unit || "kg"}
                </p>
            </div>
            {onAdd && (
                <button
                    onClick={() => onAdd(product)}
                    className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-dark dark:text-primary hover:bg-primary hover:text-text-main transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
            )}
        </div>
    );
}
