import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET — Fetch all orders (for dashboard)
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        let query = db.select().from(orders);

        // If customer, only show their own orders
        if (user.role === "cliente") {
            const userOrders = await db
                .select()
                .from(orders)
                .where(eq(orders.userId, user.id))
                .orderBy(desc(orders.createdAt));
            return NextResponse.json({ orders: userOrders });
        }

        // staff/admin see all
        const allOrders = await db
            .select()
            .from(orders)
            .orderBy(desc(orders.createdAt));

        return NextResponse.json({ orders: allOrders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
    }
}

// POST — Create a new order
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { items, totalAmount, notes = "", estimatedMinutes = 15 } = body;

        if (!items || !items.length) {
            return NextResponse.json({ error: "El pedido está vacío" }, { status: 400 });
        }

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

        const [newOrder] = await db
            .insert(orders)
            .values({
                userId: user.id,
                orderNumber,
                status: "pending",
                totalAmount: String(totalAmount),
                notes: notes,
                items: items,
                estimatedMinutes,
            })
            .returning();

        // Parse qty: extract numeric value from strings like "0.5kg", "300g"
        const parseQty = (qty: string): string => {
            if (!qty) return "1";
            const match = String(qty).match(/([\d.]+)/);
            return match ? match[1] : "1";
        };

        try {
            const validItems = items
                .filter((item: any) => item.productId && !isNaN(Number(item.productId)))
                .map((item: any) => ({
                    orderId: newOrder.id,
                    productId: Number(item.productId),
                    quantity: parseQty(item.qty),
                    unitPrice: String(item.unitPrice || item.price || "0"),
                }));

            if (validItems.length > 0) {
                await db.insert(orderItems).values(validItems);
            }
        } catch (itemError) {
            // Log but don't fail — the order itself was already created
            console.warn("Could not insert order_items:", itemError);
        }

        return NextResponse.json({ success: true, order: newOrder });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}

// PATCH — Update order status
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
        }

        const [updated] = await db
            .update(orders)
            .set({ status, updatedAt: new Date() })
            .where(eq(orders.id, orderId))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
    }
}
