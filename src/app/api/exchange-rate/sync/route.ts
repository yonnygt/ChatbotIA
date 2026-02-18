import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeRates, products } from "@/lib/schema";
import { sql } from "drizzle-orm";
import https from "node:https";

async function fetchBCVPage(): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.get(
            "https://www.bcv.org.ve/",
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
                rejectUnauthorized: false, // BCV has certificate chain issues
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => resolve(data));
                res.on("error", reject);
            }
        );
        req.on("error", reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error("BCV request timed out"));
        });
    });
}

export async function POST() {
    try {
        console.log("[BCV] Starting BCV fetch...");
        const html = await fetchBCVPage();
        console.log(`[BCV] Got HTML, length: ${html.length}`);

        // Parse USD rate from div#dolar
        // Actual BCV HTML: <div class="centrado"><strong> 396,36740000 </strong></div>
        const dolarMatch = html.match(/id="dolar"[\s\S]*?centrado[^>]*>\s*<strong>\s*([\d.,]+)\s*<\/strong>/i);

        if (!dolarMatch || !dolarMatch[1]) {
            console.log("[BCV] Regex failed to match. Trying fallback...");
            const dolarIdx = html.indexOf('id="dolar"');
            if (dolarIdx > -1) {
                console.log("[BCV] HTML around dolar:", html.substring(dolarIdx, dolarIdx + 500));
            }
            return NextResponse.json({ error: "No se pudo extraer la tasa del BCV" }, { status: 500 });
        }

        console.log("[BCV] Raw rate match:", dolarMatch[1]);
        // BCV format: "396,36740000" — comma as decimal separator, no thousands dots
        const rateStr = dolarMatch[1].trim().replace(/\./g, "").replace(",", ".");
        const rate = parseFloat(rateStr);
        console.log("[BCV] Parsed rate:", rate);

        if (isNaN(rate) || rate <= 0) {
            return NextResponse.json({ error: "Tasa BCV inválida", raw: dolarMatch[1] }, { status: 500 });
        }

        // Store the rate
        const [saved] = await db
            .insert(exchangeRates)
            .values({
                currency: "USD",
                rateVes: rate.toFixed(4),
                source: "BCV",
            })
            .returning();
        console.log("[BCV] Rate saved:", saved);

        // Update all products with VES price
        await db.execute(
            sql`UPDATE products SET price_ves = ROUND(price * ${rate.toFixed(4)}::numeric, 4)`
        );
        console.log("[BCV] Products updated");

        return NextResponse.json({
            success: true,
            rate: rate.toFixed(4),
            source: "BCV",
            fetchedAt: saved.fetchedAt,
        });
    } catch (error) {
        console.error("[BCV] Sync error:", error);
        console.error("[BCV] Error stack:", error instanceof Error ? error.stack : String(error));
        return NextResponse.json({ error: "Error al sincronizar con BCV", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
