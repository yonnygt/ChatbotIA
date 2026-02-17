import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";

// Category metadata for display
const categoryMeta: Record<string, { emoji: string; icon: string; description: string }> = {
    carnes: { emoji: "🥩", icon: "lunch_dining", description: "Cortes frescos de res, cerdo y pollo" },
    charcutería: { emoji: "🍖", icon: "bakery_dining", description: "Jamones, salamis y embutidos selectos" },
    preparados: { emoji: "🍗", icon: "skillet", description: "Platos listos y marinados" },
};

export async function GET() {
    try {
        const result = await db
            .selectDistinct({ category: products.category })
            .from(products);

        const categories = result.map((row) => {
            const key = row.category.toLowerCase();
            const meta = categoryMeta[key] || { emoji: "📦", icon: "category", description: "Productos variados" };
            return {
                name: row.category,
                ...meta,
            };
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
