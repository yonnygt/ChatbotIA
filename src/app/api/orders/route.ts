import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET — Fetch all orders (for dashboard)
export async function GET() {
    try {
        const allOrders = await db
            .select()
            .from(orders)
            .orderBy(desc(orders.createdAt));

        return NextResponse.json(allOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
    }
}

// POST — Create a new order
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, totalAmount, userId = "user-123" } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items provided" }, { status: 400 });
        }

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const [newOrder] = await db
            .insert(orders)
            .values({
                userId,
                orderNumber,
                status: "pending",
                totalAmount: totalAmount.toString(),
                priority: "normal",
                estimatedMinutes: 15,
            })
            .returning();

        const itemsToInsert = items.map((item: any) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.qty,
            unitPrice: item.price.toString(),
        }));

        await db.insert(orderItems).values(itemsToInsert);

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
