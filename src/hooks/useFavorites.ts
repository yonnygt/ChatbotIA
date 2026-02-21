import { useState, useEffect, useCallback } from "react";
import { Product } from "@/lib/types";

export function useFavorites() {
    const [favorites, setFavorites] = useState<number[]>([]); // Store product IDs
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]); // Store full product details
    const [loading, setLoading] = useState(true);

    // Fetch favorites
    const fetchFavorites = useCallback(async () => {
        try {
            const res = await fetch(`/api/favorites`);
            if (res.ok) {
                const data = await res.json();
                const favs = data.favorites || [];
                setFavorites(favs.map((f: any) => f.productId));

                // Map API response to Product type
                const products: Product[] = favs.map((f: any) => ({
                    id: f.productId,
                    name: f.productName,
                    category: f.productCategory,
                    price: f.productPrice,
                    imageUrl: f.productImage || null,
                    inStock: f.inStock,
                    description: null, // API might not return all details, careful
                    unit: null,
                    priceVes: null,
                    sku: null,
                    location: null
                }));
                setFavoriteProducts(products);
            }
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const toggleFavorite = async (product: Product) => {

        const isFav = favorites.includes(product.id);
        const action = isFav ? "remove" : "add";

        // Optimistic update
        setFavorites(prev =>
            isFav ? prev.filter(id => id !== product.id) : [...prev, product.id]
        );

        if (isFav) {
            setFavoriteProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            setFavoriteProducts(prev => [...prev, product]);
        }

        try {
            await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.id,
                    action
                })
            });
        } catch (error) {
            console.error("Error toggling favorite", error);
            // Revert on error would go here
            fetchFavorites();
        }
    };

    const isFavorite = (productId: number) => favorites.includes(productId);

    return {
        favorites, // IDs
        favoriteProducts, // Product objects
        loading,
        toggleFavorite,
        isFavorite,
        refreshFavorites: fetchFavorites
    };
}
