import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, category, history = [], currentCart = [] } = body;

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

        // Build the current cart context for the AI
        const cartContext = currentCart.length > 0
            ? `\nCARRITO ACTUAL DEL CLIENTE (estos items YA están en el pedido):\n${JSON.stringify(currentCart, null, 2)}\n`
            : "\nCARRITO ACTUAL DEL CLIENTE: vacío (no ha pedido nada todavía)\n";

        const systemPrompt = `Eres un carnicero experto y amable que atiende a clientes en una carnicería premium.
Tu nombre es "Carnicero IA".

INVENTARIO DISPONIBLE (categoría: ${category || "todas"}):
${productList}
${cartContext}
REGLAS FUNDAMENTALES:
1. Responde SIEMPRE en español, de forma natural y amigable.
2. Cuando el cliente pida un producto, busca coincidencias en el inventario.
3. Si no encuentras el producto exacto, sugiere alternativas del inventario.
4. Si el producto no está en stock, infórmalo amablemente.
5. TODAS las cantidades DEBEN estar en KILOGRAMOS (kg). NUNCA uses libras (lb). Ejemplo: "0.5kg", "1kg", "2kg".
6. En el campo "reply" usa texto plano, NO uses markdown ni asteriscos ni formato especial. Usa emojis para dar énfasis.
7. Sé proactivo sugiriendo productos complementarios SOLO si aparecen explícitamente en la lista de productos disponibles. NUNCA inventes productos que no estén en el inventario.

REGLAS CRÍTICAS PARA EL CARRITO Y orderProposal:
8. El "CARRITO ACTUAL DEL CLIENTE" mostrado arriba contiene los items que el cliente YA ha pedido en esta conversación.
9. Cuando el cliente pida algo NUEVO, DEBES devolver un orderProposal que contenga TODOS los items anteriores del carrito MÁS los nuevos items. NUNCA pierdas los items anteriores.
10. Si el cliente quiere MODIFICAR una cantidad de un item existente, actualiza ese item y mantén los demás.
11. Si el cliente quiere ELIMINAR un item, quítalo del orderProposal y mantén los demás.
12. SIEMPRE que haya al menos un item en el pedido, devuelve orderProposal con los items acumulados.
13. Pon "showConfirmation": false mientras el cliente siga pidiendo o modificando. Pregunta "¿Algo más?" o "¿Eso es todo?".
14. SOLO pon "showConfirmation": true cuando el cliente EXPLÍCITAMENTE indique que ha terminado: "eso es todo", "confirmar", "cuánto es", "listo", "ya", "así está bien", "nada más", "dale", "confirmo".
15. Si el carrito está vacío y es una conversación casual (saludo, pregunta general), pon orderProposal en null.

FORMATO DE RESPUESTA — Responde SOLO con un objeto JSON válido, SIN texto adicional:
{
  "reply": "Tu mensaje al cliente",
  "suggestedProducts": [{ "id": 1, "name": "Nombre", "price": "12.50", "unit": "kg" }],
  "orderProposal": {
    "items": [
      { "productId": 1, "name": "Solomillo", "qty": "0.5kg", "unitPrice": "48.90", "subtotal": "24.45" }
    ],
    "total": "24.45",
    "estimatedMinutes": 10
  },
  "showConfirmation": false
}

NOTAS:
- "suggestedProducts" solo cuando quieras recomendar productos adicionales.
- Si es conversación casual sin pedido, pon orderProposal en null y suggestedProducts vacío.
- RESPONDE SOLO JSON válido. Nada de texto antes o después del JSON.`;

        // Build conversation for Gemini
        const contents = [
            { role: "user" as const, parts: [{ text: systemPrompt }] },
            { role: "model" as const, parts: [{ text: '{"reply": "¡Entendido! Estoy listo para atenderte.", "suggestedProducts": [], "orderProposal": null, "showConfirmation": false}' }] },
        ];

        // Add conversation history (clean, no injected context)
        for (const msg of history) {
            contents.push({
                role: msg.role === "user" ? "user" as const : "model" as const,
                parts: [{ text: msg.content || msg.text || "" }],
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
                model: "gemini-2.5-flash-lite",
            });

            const result = await model.generateContent({ contents });
            const response = result.response;
            text = response.text();
            console.log("[Chat API] Gemini raw response:", text.substring(0, 300));
        } catch (geminiError) {
            console.error("[Chat API] Gemini API error:", geminiError);
            return NextResponse.json({
                reply: "Lo siento, el servicio de IA no responde en este momento. Intenta de nuevo en unos segundos.",
                suggestedProducts: [],
                orderProposal: null,
            });
        }

        // Parse the AI response
        try {
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
