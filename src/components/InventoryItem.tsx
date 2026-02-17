import type { Product } from "@/lib/types";

interface InventoryItemProps {
    readonly product: Product;
    readonly onToggleStock?: (product: Product) => void;
}

export default function InventoryItem({
    product,
    onToggleStock,
}: InventoryItemProps) {
    const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

    return (
        <div className="flex items-center gap-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-700/50 p-4 shadow-sm transition-all hover:shadow-md">
            {/* Image or placeholder */}
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                {product.imageUrl ? (
                    <img
                        className="h-full w-full object-cover"
                        src={product.imageUrl}
                        alt={product.name}
                    />
                ) : (
                    <span className="material-symbols-outlined text-gray-400 text-[28px]">
                        inventory_2
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-text-main dark:text-white">
                    {product.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{product.description || ""}</p>
                <div className="flex items-center gap-2 mt-1">
                    {product.sku && (
                        <>
                            <span className="text-xs font-medium text-gray-400">SKU: {product.sku}</span>
                            <span className="text-xs text-gray-400">•</span>
                        </>
                    )}
                    <span className="text-xs text-gray-400 capitalize">{product.category}</span>
                    {product.location && (
                        <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{product.location}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Price + Toggle */}
            <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-bold text-primary-dark dark:text-primary">
                    {price.toFixed(2)} €/{product.unit || "kg"}
                </p>
                <button
                    onClick={() => onToggleStock?.(product)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${product.inStock ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${product.inStock ? "translate-x-6" : "translate-x-1"}`}
                    />
                </button>
            </div>
        </div>
    );
}
