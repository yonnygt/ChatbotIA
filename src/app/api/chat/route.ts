import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, orders, orderItems } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, category, conversationHistory = [], action } = body;

        // Handle order creation action
        if (action === "confirm_order") {
            return await createOrder(body);
        }

        const apiKey = process.env.GOOGLE_API_KEY?.trim();

        if (!apiKey) {
            return NextResponse.json({
                reply: "El servicio de IA no está disponible en este momento. Por favor intenta más tarde.",
                suggestedProducts: [],
            });
        }

        // Fetch products from DB filtered by category
        let inventory;
        try {
            if (category) {
                inventory = await db.select().from(products).where(eq(products.category, category));
            } else {
                inventory = await db.select().from(products);
            }
            console.log(`[Chat API] Fetched ${inventory.length} products for category: ${category || "all"}`);
        } catch (dbError) {
            console.error("[Chat API] DB error:", dbError);
            return NextResponse.json({
                reply: "Error al consultar los productos. Intenta de nuevo.",
                suggestedProducts: [],
                orderProposal: null,
            });
        }

        const productList = inventory
            .map(
                (p) =>
                    `- ${p.name} | Precio: ${p.price}€/kg | ID: ${p.id} | En stock: ${p.inStock ? "Sí" : "No"} | Descripción: ${p.description || "N/A"}`
            )
            .join("\n");

        const systemPrompt = `Eres un carnicero experto y amable que atiende a clientes en una carnicería premium.
Tu nombre es "Carnicero IA".

INVENTARIO DISPONIBLE (categoría: ${category || "todas"}):
${productList}

REGLAS:
1. Responde SIEMPRE en español, de forma natural y amigable.
2. Cuando el cliente pida un producto, busca coincidencias en el inventario.
3. Si no encuentras el producto exacto, sugiere alternativas del inventario.
4. Si el producto no está en stock, infórmalo amablemente.
5. Cuando el cliente quiera hacer un pedido, genera una propuesta con los items detectados.
6. Sé proactivo sugiriendo productos complementarios.
7. En el campo "reply" usa texto plano, NO uses markdown ni asteriscos ni formato especial.
8. Usa emojis para dar énfasis en lugar de negritas o asteriscos.
9. TODAS las cantidades DEBEN estar en KILOGRAMOS (kg). NO uses libras (lb) ni hagas conversiones. Si un producto tiene unidad "lb" en el inventario, ignórala y usa "kg" en su lugar. Ejemplo: "0.5kg", "1kg", "2kg".

FORMATO DE RESPUESTA — Responde SOLO con un objeto JSON válido, SIN texto adicional antes ni después:
{
  "reply": "Tu mensaje al cliente en texto plano sin markdown",
  "suggestedProducts": [{ "id": 1, "name": "Nombre", "price": "12.50", "unit": "kg" }],
  "orderProposal": null
}

Para orderProposal (SOLO cuando el cliente confirma un pedido):
{
  "reply": "Mensaje",
  "suggestedProducts": [],
  "orderProposal": {
    "items": [{ "productId": 1, "name": "Solomillo", "qty": "0.5kg", "unitPrice": "48.90", "subtotal": "24.45" }],
    "total": "24.45",
    "estimatedMinutes": 10
  }
}

NOTAS IMPORTANTES:
- RESPONDE SOLO JSON. Nada de texto antes o después del JSON.
- "reply" debe ser texto plano legible, sin asteriscos, sin markdown
- Si el cliente pregunta qué hay disponible, lista los productos dentro del texto de "reply" de forma natural
- "suggestedProducts" solo cuando quieras recomendar productos adicionales
- "orderProposal" SOLO cuando el cliente ha pedido algo concreto y quiere confirmar
- Si el cliente dice "sí", "confirmo", "dale", genera el orderProposal con los items mencionados
- Si es conversación casual (saludo, pregunta), pon orderProposal en null y suggestedProducts vacío
- SIEMPRE usa kilogramos (kg) para cantidades, NUNCA libras (lb)`;

        // Build conversation for Gemini
        const contents = [
            { role: "user" as const, parts: [{ text: systemPrompt }] },
            { role: "model" as const, parts: [{ text: '{"reply": "¡Entendido! Estoy listo para atenderte.", "suggestedProducts": [], "orderProposal": null}' }] },
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            contents.push({
                role: msg.role === "user" ? "user" as const : "model" as const,
                parts: [{ text: msg.text }],
            });
        }

        // Add current message
        contents.push({
            role: "user" as const,
            parts: [{ text: message }],
        });

        let text: string;
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                // model: "gemini-2.0-flash",
                model: "gemini-2.5-flash-lite",
            });

            const result = await model.generateContent({ contents });
            const response = result.response;
            text = response.text();
            console.log("[Chat API] Gemini raw response:", text.substring(0, 200));
        } catch (geminiError) {
            console.error("[Chat API] Gemini API error:", geminiError);
            return NextResponse.json({
                reply: "Lo siento, el servicio de IA no responde en este momento. Intenta de nuevo en unos segundos.",
                suggestedProducts: [],
                orderProposal: null,
            });
        }

        try {
            // Try direct parse first
            const parsed = JSON.parse(text.trim());
            return NextResponse.json(parsed);
        } catch {
            // Fallback: extract JSON from mixed output
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return NextResponse.json(parsed);
                }
            } catch {
                // ignore nested parse error
            }

            // Last resort: clean up the raw text
            const cleanText = text
                .replace(/```json\n?/g, "")
                .replace(/```/g, "")
                .replace(/\*\*/g, "")
                .replace(/^\* /gm, "• ")
                .trim();

            return NextResponse.json({
                reply: cleanText,
                suggestedProducts: [],
                orderProposal: null,
            });
        }
    } catch (error) {
        console.error("[Chat API] Unhandled error:", error);
        return NextResponse.json(
            {
                reply: "Error procesando tu mensaje. Intenta de nuevo.",
                error: error instanceof Error ? error.message : String(error),
                suggestedProducts: [],
                orderProposal: null,
            },
            { status: 500 }
        );
    }
}

async function createOrder(body: any) {
    try {
        const { orderItems: items, userId = "customer-web" } = body;

        console.log("createOrder called with items:", JSON.stringify(items));

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items provided" }, { status: 400 });
        }

        // Parse qty: extract numeric value from strings like "500g", "1kg", "2 ud"
        const parseQty = (qty: string): string => {
            if (!qty) return "1";
            const match = String(qty).match(/([\d.]+)/);
            if (!match) return "1";
            return match[1];
        };

        const total = items.reduce(
            (acc: number, item: any) => acc + parseFloat(item.subtotal || item.unitPrice || "0"),
            0
        );

        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;

        // Build notes from items
        const notesText = items.map((item: any) => `${item.name || "Producto"}: ${item.qty || "1"}`).join(", ");

        const [newOrder] = await db
            .insert(orders)
            .values({
                userId,
                orderNumber,
                status: "pending",
                totalAmount: total.toFixed(2),
                priority: "normal",
                estimatedMinutes: 15,
                notes: notesText,
                items: items, // jsonb accepts objects directly, don't stringify
            })
            .returning();

        // Try to insert order items, but don't fail the whole order if productIds are invalid
        try {
            const validItems = items
                .filter((item: any) => item.productId && !isNaN(Number(item.productId)))
                .map((item: any) => ({
                    orderId: newOrder.id,
                    productId: Number(item.productId),
                    quantity: parseQty(item.qty),
                    unitPrice: String(item.unitPrice || "0"),
                }));

            if (validItems.length > 0) {
                await db.insert(orderItems).values(validItems);
            }
        } catch (itemError) {
            // Log but don't fail - the order itself was created successfully
            console.warn("Could not insert order_items (productIds may not match DB):", itemError);
        }

        return NextResponse.json({
            success: true,
            order: newOrder,
            reply: `¡Pedido #${newOrder.orderNumber} confirmado! 🎉 Estará listo en aproximadamente 15 minutos.`,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({
            error: "Failed to create order",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
