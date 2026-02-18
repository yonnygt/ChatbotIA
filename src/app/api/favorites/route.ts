import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { favorites, products } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// GET — Fetch all favorites for a user
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const userFavorites = await db
            .select({
                favoriteId: favorites.id,
                productId: products.id,
                productName: products.name,
                productCategory: products.category,
                productPrice: products.price,
                productImage: products.imageUrl,
                inStock: products.inStock,
            })
            .from(favorites)
            .innerJoin(products, eq(favorites.productId, products.id))
            .where(eq(favorites.userId, userId));

        return NextResponse.json({ favorites: userFavorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json({ error: "Error al obtener favoritos" }, { status: 500 });
    }
}

// POST — Add or remove a favorite
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, productId, action } = body;

        if (!userId || !productId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (action === "remove") {
            await db
                .delete(favorites)
                .where(and(eq(favorites.userId, userId), eq(favorites.productId, Number(productId))));
            return NextResponse.json({ success: true, message: "Removed from favorites" });
        } else {
            // Check if already exists to avoid duplicates
            const existing = await db
                .select()
                .from(favorites)
                .where(and(eq(favorites.userId, userId), eq(favorites.productId, Number(productId))));

            if (existing.length > 0) {
                return NextResponse.json({ success: true, message: "Already in favorites" });
            }

            await db.insert(favorites).values({
                userId,
                productId: Number(productId),
            });
            return NextResponse.json({ success: true, message: "Added to favorites" });
        }
    } catch (error) {
        console.error("Error managing favorites:", error);
        return NextResponse.json({ error: "Error al gestionar favoritos" }, { status: 500 });
    }
}
