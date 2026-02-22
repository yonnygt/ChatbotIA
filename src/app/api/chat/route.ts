import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, favorites, sections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

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

        // Fetch products from DB filtered by section slug
        let inventory;
        try {
            if (category) {
                // Look up section by slug
                const [section] = await db.select().from(sections).where(eq(sections.slug, category));
                if (section) {
                    inventory = await db.select().from(products).where(eq(products.sectionId, section.id));
                } else {
                    // Fallback to legacy category field
                    inventory = await db.select().from(products).where(eq(products.category, category));
                }
            } else {
                inventory = await db.select().from(products);
            }
            console.log(`[Chat API] Fetched ${inventory.length} products for section: ${category || "all"}`);
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

        // Fetch user favorites if authenticated
        let favoritesContext = "";
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                const userFavorites = await db
                    .select({
                        productName: products.name,
                        productPrice: products.price,
                        productCategory: products.category,
                        inStock: products.inStock,
                    })
                    .from(favorites)
                    .innerJoin(products, eq(favorites.productId, products.id))
                    .where(eq(favorites.userId, currentUser.id));

                if (userFavorites.length > 0) {
                    const favList = userFavorites
                        .map(f => `- ${f.productName} | ${f.productPrice}€ | ${f.inStock ? "En stock" : "Agotado"}`)
                        .join("\n");
                    favoritesContext = `\nPRODUCTOS FAVORITOS DEL CLIENTE (los ha marcado como favoritos):\n${favList}\n`;
                }
            }
        } catch (err) {
            console.error("[Chat API] Error fetching favorites:", err);
        }

        // Build the current cart context for the AI
        const cartContext = currentCart.length > 0
            ? `\nCARRITO ACTUAL DEL CLIENTE (estos items YA están en el pedido):\n${JSON.stringify(currentCart, null, 2)}\n`
            : "\nCARRITO ACTUAL DEL CLIENTE: vacío (no ha pedido nada todavía)\n";

        const systemPrompt = `Eres un asistente experto y amable que atiende a clientes en un supermercado premium.
Tu nombre es "Asistente SuperMarket".

INVENTARIO DISPONIBLE (categoría: ${category || "todas"}):
${productList}
${favoritesContext}${cartContext}
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

REGLAS DE CONFIRMACIÓN (MUY IMPORTANTE):
13. Pon "showConfirmation": false mientras el cliente siga pidiendo o modificando items.
14. Pon "showConfirmation": true SOLO cuando el cliente diga EXPLÍCITAMENTE que quiere finalizar: "eso es todo", "cuánto es", "listo", "ya", "así está bien", "nada más".
15. Si el cliente dice "confirmar", "confirmo", "dale", "sí", "ok" o similar DESPUÉS de que ya se mostró el resumen:
    - Pon "autoConfirm": true
    - DEBES incluir el orderProposal completo con TODOS los items del carrito
    - Pon "showConfirmation": true
16. Si el carrito está vacío y es una conversación casual (saludo, pregunta general), pon orderProposal en null.
17. NO preguntes múltiples veces si desea confirmar. Si ya mostraste el resumen con showConfirmation: true, y el cliente responde afirmativamente, activa autoConfirm: true y envía el orderProposal completo.
18. CRÍTICO: Si autoConfirm es true, orderProposal NO puede ser null. Debe contener todos los items del carrito.
19. Si el cliente menciona "mis favoritos", "lo de siempre", "productos favoritos" o similar, consulta la sección PRODUCTOS FAVORITOS DEL CLIENTE y sugiere esos productos. Si alguno está agotado, infórmalo.

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
  "showConfirmation": false,
  "autoConfirm": false
}

NOTAS:
- "suggestedProducts" solo cuando quieras recomendar productos adicionales.
- Si es conversación casual sin pedido, pon orderProposal en null y suggestedProducts vacío.
- "autoConfirm" debe ser true SOLO cuando el cliente confirme explícitamente un pedido que ya tiene showConfirmation: true.
- RESPONDE SOLO JSON válido. Nada de texto antes o después del JSON.`;

        // Build conversation for Gemini
        const contents = [
            { role: "user" as const, parts: [{ text: systemPrompt }] },
            { role: "model" as const, parts: [{ text: '{"reply": "¡Entendido! Estoy listo para atenderte.", "suggestedProducts": [], "orderProposal": null, "showConfirmation": false, "autoConfirm": false}' }] },
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
