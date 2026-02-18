import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();

        if (!q || q.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchPattern = `%${q}%`;

        const results = await db
            .select()
            .from(products)
            .where(
                or(
                    ilike(products.name, searchPattern),
                    ilike(products.category, searchPattern),
                    ilike(products.description, searchPattern)
                )
            )
            .limit(10);

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
    }
}
