import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const [latest] = await db
            .select()
            .from(exchangeRates)
            .orderBy(desc(exchangeRates.fetchedAt))
            .limit(1);

        if (!latest) {
            return NextResponse.json({ rate: null, message: "No hay tasa registrada" });
        }

        return NextResponse.json({
            rate: latest.rateVes,
            currency: latest.currency,
            source: latest.source,
            fetchedAt: latest.fetchedAt,
        });
    } catch (error) {
        console.error("Exchange rate fetch error:", error);
        return NextResponse.json({ error: "Error al obtener tasa" }, { status: 500 });
    }
}
