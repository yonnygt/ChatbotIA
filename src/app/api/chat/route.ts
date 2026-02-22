import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, favorites, sections } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const PENDING_REQUESTS = new Set<string>();

export async function POST(req: NextRequest) {
    let sessionKey = "anonymous";
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
        // Base rate limiting on IP
        const { limited, retryAfter } = rateLimit(`chat_${ip}`, 20, 60000); // 20 requests per minute
        if (limited) {
            return NextResponse.json(
                {
                    reply: `Por favor espera ${retryAfter} segundos antes de enviar otro mensaje.`,
                    suggestedProducts: [],
                    orderProposal: null,
                },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const body = await req.json();
        const { message, category, history = [], currentCart = [] } = body;

        // User based deduplication to prevent double sends
        const currentUser = await getCurrentUser();
        sessionKey = currentUser ? `user_${currentUser.id}` : `ip_${ip}`;
        if (PENDING_REQUESTS.has(sessionKey)) {
            return NextResponse.json(
                {
                    reply: "Ya estoy procesando tu mensaje anterior. Un momento por favor.",
                    suggestedProducts: [],
                    orderProposal: null,
                },
                { status: 429 }
            );
        }
        PENDING_REQUESTS.add(sessionKey);

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

        // Separate in-stock and out-of-stock for the AI
        const inStockProducts = inventory.filter(p => p.inStock);
        const outOfStockProducts = inventory.filter(p => !p.inStock);

        const inStockList = inStockProducts.length > 0
            ? inStockProducts.map(p => `- ${p.name} | ${p.price}€/kg | ${p.description || "Sin descripción"} [productId=${p.id}]`).join("\n")
            : "(No hay productos disponibles en este momento)";

        const outOfStockList = outOfStockProducts.length > 0
            ? outOfStockProducts.map(p => `- ${p.name} (AGOTADO)`).join("\n")
            : "";

        const outOfStockSection = outOfStockList
            ? `\nPRODUCTOS AGOTADOS (informar si preguntan, NUNCA ofrecerlos activamente):\n${outOfStockList}\n`
            : "";

        // Fetch user favorites if authenticated
        let favoritesContext = "";
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                // Build favorites query filtered by current section
                const favConditions = [eq(favorites.userId, currentUser.id)];

                // Filter favorites to current section if we have one
                if (category) {
                    const [section] = await db.select().from(sections).where(eq(sections.slug, category));
                    if (section) {
                        favConditions.push(eq(products.sectionId, section.id));
                    }
                }

                const userFavorites = await db
                    .select({
                        productName: products.name,
                        productPrice: products.price,
                        productCategory: products.category,
                        inStock: products.inStock,
                    })
                    .from(favorites)
                    .innerJoin(products, eq(favorites.productId, products.id))
                    .where(and(...favConditions));

                if (userFavorites.length > 0) {
                    const favList = userFavorites
                        .map(f => `- ${f.productName} | ${f.productPrice}€ | ${f.inStock ? "En stock" : "Agotado"}`)
                        .join("\n");
                    favoritesContext = `\nPRODUCTOS FAVORITOS DEL CLIENTE EN ESTA SECCIÓN:\n${favList}\n`;
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

═══════════════════════════════════════════
PRODUCTOS DISPONIBLES PARA VENTA (sección: ${category || "todas"}):
${inStockList}
${outOfStockSection}
═══════════════════════════════════════════
${favoritesContext}${cartContext}
⚠️ REGLA MÁXIMA — INVENTARIO CERRADO:
• La lista de PRODUCTOS DISPONIBLES de arriba es el ÚNICO inventario que existe. NO existe ningún otro producto.
• JAMÁS inventes, imagines, sugieras ni menciones productos que NO aparezcan TEXTUALMENTE en la lista anterior.
• Si el cliente pide algo que NO está en la lista, responde: "Lo siento, ese producto no está disponible en nuestra sección en este momento."
• NUNCA sugieras productos complementarios (papas, salsas, aderezos, guarniciones, etc.) a menos que aparezcan EXPLÍCITAMENTE en la lista de arriba.
• Si el cliente pregunta "¿qué tienes?", lista ÚNICAMENTE los productos de la lista PRODUCTOS DISPONIBLES.
• Los productos AGOTADOS solo se mencionan si el cliente pregunta específicamente por ellos. NUNCA los ofrezcas activamente.
• NUNCA muestres IDs de productos, códigos internos ni datos técnicos al cliente. El [productId=X] es SOLO para uso interno en orderProposal.

REGLAS GENERALES:
1. Responde SIEMPRE en español, de forma natural y amigable.
2. Cuando el cliente pida un producto, busca coincidencias EXACTAS en el inventario disponible.
3. Si no encuentras el producto exacto, sugiere alternativas SOLO de la lista de productos disponibles.
4. TODAS las cantidades DEBEN estar en KILOGRAMOS (kg). NUNCA uses libras (lb).
5. En el campo "reply" usa formato Markdown para mejor visualización: usa **negrita** para nombres de productos, listas con - para enumerar productos, y emojis para dar énfasis. NO uses bloques de código.

REGLAS CRÍTICAS PARA EL CARRITO Y orderProposal:
6. El "CARRITO ACTUAL DEL CLIENTE" contiene los items que el cliente YA ha pedido.
7. Cuando el cliente pida algo NUEVO, devuelve un orderProposal con TODOS los items anteriores MÁS los nuevos. NUNCA pierdas items anteriores.
8. Si el cliente quiere MODIFICAR una cantidad, actualiza ese item y mantén los demás.
9. Si el cliente quiere ELIMINAR un item, quítalo y mantén los demás.
10. SIEMPRE que haya al menos un item, devuelve orderProposal con los items acumulados.

REGLAS DE CONFIRMACIÓN:
11. Pon "showConfirmation": false mientras el cliente siga pidiendo o modificando items.
12. Pon "showConfirmation": true SOLO cuando el cliente diga EXPLÍCITAMENTE que quiere finalizar: "eso es todo", "cuánto es", "listo", "ya", "así está bien", "nada más".
13. Si el cliente dice "confirmar", "confirmo", "dale", "sí" DESPUÉS de que ya se mostró el resumen:
    - Pon "autoConfirm": true
    - Incluye el orderProposal completo con TODOS los items
    - Pon "showConfirmation": true
14. Si el carrito está vacío y es conversación casual, pon orderProposal en null.
15. NO preguntes múltiples veces si desea confirmar.
16. CRÍTICO: Si autoConfirm es true, orderProposal NO puede ser null.
17. Si el cliente menciona "mis favoritos" o "lo de siempre", consulta PRODUCTOS FAVORITOS DEL CLIENTE.

FORMATO DE RESPUESTA — SOLO JSON válido, SIN texto adicional:
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
  "quickReplies": ["Opción 1", "Opción 2"],
  "showConfirmation": false,
  "autoConfirm": false
}

REGLAS DE quickReplies (respuestas rápidas):
- SIEMPRE incluye 2-4 opciones de respuesta rápida relevantes al contexto actual.
- Si el cliente acaba de pedir un producto: ["Eso es todo", "Quiero agregar algo más", "¿Qué más tienes?"]
- Si preguntas si desea algo más: ["Sí, quiero más", "No, eso es todo", "Ver productos disponibles"]
- Si se muestra el resumen/confirmación: ["Confirmar pedido", "Modificar pedido", "Cancelar"]
- Si es conversación casual o saludo inicial: ["¿Qué tienen disponible?", "Quiero hacer un pedido", "Ver mis favoritos"]
- Las opciones deben ser frases cortas (máx 25 caracteres) y naturales en español.

NOTAS:
- "suggestedProducts" SOLO con productos de la lista de inventario disponible, NUNCA inventados.
- Si es conversación casual sin pedido, pon orderProposal en null y suggestedProducts vacío.
- RESPONDE SOLO JSON válido.`;

        // Build conversation for Gemini
        const contents = [
            { role: "user" as const, parts: [{ text: systemPrompt }] },
            { role: "model" as const, parts: [{ text: '{"reply": "¡Entendido! Estoy listo para atenderte.", "suggestedProducts": [], "orderProposal": null, "quickReplies": [], "showConfirmation": false, "autoConfirm": false}' }] },
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

            // 30s timeout for Gemini API call
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), 30000);

            const result = await model.generateContent({ contents }, { signal: abortController.signal });
            clearTimeout(timeoutId);

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
    } finally {
        PENDING_REQUESTS.delete(sessionKey);
    }
}
