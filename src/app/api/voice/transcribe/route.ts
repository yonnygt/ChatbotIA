import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // 60 seconds

// Configure maximum allowed file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─── Concurrency Semaphore ──────────────────────────
// Limits simultaneous Gemini API calls to prevent overload with 200+ users
const MAX_CONCURRENT = 5;
const QUEUE_TIMEOUT = 30000; // 30s max wait in queue
let activeTasks = 0;
const waitQueue: Array<{ resolve: (acquired: boolean) => void; timer: ReturnType<typeof setTimeout> }> = [];

async function acquireSlot(): Promise<boolean> {
    if (activeTasks < MAX_CONCURRENT) {
        activeTasks++;
        return true;
    }

    // Wait in queue
    return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
            // Remove from queue on timeout
            const idx = waitQueue.findIndex((w) => w.resolve === resolve);
            if (idx !== -1) waitQueue.splice(idx, 1);
            resolve(false);
        }, QUEUE_TIMEOUT);

        waitQueue.push({ resolve, timer });
    });
}

function releaseSlot() {
    activeTasks--;
    if (waitQueue.length > 0) {
        const next = waitQueue.shift()!;
        clearTimeout(next.timer);
        activeTasks++;
        next.resolve(true);
    }
}

function getQueuePosition(): number {
    return waitQueue.length;
}

export async function POST(request: NextRequest) {
    let slotAcquired = false;
    try {
        // Rate limit by userId if authenticated, fallback to IP
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip";
        let rateLimitKey = `transcribe_${ip}`;

        try {
            const user = await getCurrentUser();
            if (user) {
                rateLimitKey = `transcribe_user_${user.id}`;
            }
        } catch {
            // Continue with IP-based rate limiting
        }

        // More permissive rate limit: 12 per minute (up from 5)
        const { limited, retryAfter } = rateLimit(rateLimitKey, 12, 60000);
        if (limited) {
            return NextResponse.json(
                {
                    text: `Por favor espera ${retryAfter} segundos antes de enviar otro audio.`,
                    intent: "other",
                    extracted_items: [],
                    queued: false,
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
                    extracted_items: [],
                },
                { status: 413 }
            );
        }

        const validMimeTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
        if (!validMimeTypes.includes(audioFile.type)) {
            console.warn(`[Transcribe API] Invalid mime type received: ${audioFile.type}`);
        }

        const apiKey = process.env.GOOGLE_API_KEY?.trim();

        if (!apiKey) {
            return NextResponse.json({
                text: "Modo desarrollo: Sin API Key",
                intent: "other",
                extracted_items: [],
            });
        }

        // ─── Acquire a processing slot (queue if busy) ────
        const queuePos = getQueuePosition();
        if (queuePos > 0) {
            console.log(`[Transcribe API] Request queued at position ${queuePos + 1}`);
        }

        slotAcquired = await acquireSlot();
        if (!slotAcquired) {
            return NextResponse.json(
                {
                    text: "El servidor está muy ocupado. Intenta de nuevo en unos segundos.",
                    intent: "other",
                    extracted_items: [],
                    queued: false,
                    serverBusy: true,
                },
                { status: 503 }
            );
        }

        console.log("[Transcribe API] Processing audio...", {
            fileType: audioFile?.type,
            fileSize: audioFile?.size,
            category,
            activeTasks,
            queueLength: waitQueue.length,
        });

        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        // Fetch products context, optionally filtered by category
        let inventory;
        if (category) {
            inventory = await db.select().from(products).where(eq(products.category, category));
        } else {
            inventory = await db.select().from(products);
        }
        const productList = inventory.map((p) => `- ${p.name} (${p.price}€) [ID: ${p.id}]`).join("\n");

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

        const result = await model.generateContent(
            [
                prompt,
                {
                    inlineData: {
                        mimeType: audioFile.type || "audio/webm",
                        data: base64Audio,
                    },
                },
            ],
            { signal: abortController.signal }
        );

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
    } finally {
        if (slotAcquired) {
            releaseSlot();
        }
    }
}
