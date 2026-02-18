import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const outOfStockProducts = await db
            .select()
            .from(products)
            .where(eq(products.inStock, false));

        return NextResponse.json({ products: outOfStockProducts });
    } catch (error) {
        console.error("Error fetching out of stock products:", error);
        return NextResponse.json({ error: "Error al obtener productos agotados" }, { status: 500 });
    }
}
