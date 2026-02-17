import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, inStock } = body;

        if (!productId || inStock === undefined) {
            return NextResponse.json({ error: "productId and inStock required" }, { status: 400 });
        }

        const [updated] = await db
            .update(products)
            .set({ inStock })
            .where(eq(products.id, productId))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error("Error toggling stock:", error);
        return NextResponse.json({ error: "Error al actualizar stock" }, { status: 500 });
    }
}
