import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // 60 seconds

// Configure maximum allowed file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip";
        // Stricter rate limit for audio (5 per minute)
        const { limited, retryAfter } = rateLimit(`transcribe_${ip}`, 5, 60000);
        if (limited) {
            return NextResponse.json(
                {
                    text: "Por favor espera un momento antes de enviar otro audio.",
                    intent: "other",
                    extracted_items: []
                },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const category = formData.get("category") as string | null;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        if (audioFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    text: "El archivo de audio es demasiado grande. Máximo 10MB.",
                    intent: "other",
                    extracted_items: []
                },
                { status: 413 }
            );
        }

        const validMimeTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
        if (!validMimeTypes.includes(audioFile.type)) {
            console.warn(`[Transcribe API] Invalid mime type received: ${audioFile.type}`);
            // We'll still try to process it but gemini might reject it
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

        // 45s timeout for Gemini Audio transcription (slower than text)
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 45000);

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio
                }
            }
        ], { signal: abortController.signal });

        clearTimeout(timeoutId);

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
