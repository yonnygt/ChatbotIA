import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const category = formData.get("category") as string | null;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY?.trim();

        console.log("Transcribing audio...", {
            hasKey: !!apiKey,
            fileType: audioFile?.type,
            fileSize: audioFile?.size,
            category,
        });

        if (!apiKey) {
            return NextResponse.json({
                text: "Modo desarrollo: Sin API Key",
                intent: "other",
                extracted_items: []
            });
        }

        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        // Fetch products context, optionally filtered by category
        let inventory;
        if (category) {
            inventory = await db.select().from(products).where(eq(products.category, category));
        } else {
            inventory = await db.select().from(products);
        }
        const productList = inventory.map(p => `- ${p.name} (${p.price}€) [ID: ${p.id}]`).join("\n");

        const prompt = `Actúa como un experto carnicero.
Inventario disponible:
${productList}

Tu tarea:
1. Transcribir LITERALMENTE lo que dice el cliente.
2. Analizar la intención (pedir, preguntar, saludar, otro).
3. Si es un pedido, extrae los productos buscando coincidencia con el inventario.
   - Devuelve "productId" (el ID numérico) si encuentras coincidencia exacta o muy cercana.
   - Si no encuentras el producto en el inventario, deja "productId" en null.

Responde ÚNICAMENTE con JSON:
{
  "text": "transcripción exacta",
  "intent": "order" | "question" | "greeting" | "other",
  "extracted_items": [
      { "productId": 12, "name": "Solomillo", "qty": "500g", "notes": "fino" }
  ]
}`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        try {
            const cleanJson = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json(parsed);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", text);
            return NextResponse.json({ text: text, intent: "other" });
        }

    } catch (error) {
        console.error("Transcription error details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
