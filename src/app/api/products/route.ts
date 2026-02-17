import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        let query;
        if (category) {
            query = await db
                .select()
                .from(products)
                .where(eq(products.category, category));
        } else {
            query = await db.select().from(products);
        }

        return NextResponse.json({ products: query });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
