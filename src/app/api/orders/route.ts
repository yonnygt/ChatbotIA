import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/schema";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { eq, desc, inArray } from "drizzle-orm";

// GET — Fetch orders (filtered by staff section)
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Customers: only their own orders
        if (user.role === "cliente") {
            const userOrders = await db
                .select()
                .from(orders)
                .where(eq(orders.userId, user.id))
                .orderBy(desc(orders.createdAt));
            return NextResponse.json({ orders: userOrders });
        }

        // Admin: see ALL orders
        if (user.role === "admin") {
            const allOrders = await db
                .select()
                .from(orders)
                .orderBy(desc(orders.createdAt));
            return NextResponse.json({ orders: allOrders });
        }

        // Staff: filter by their assigned section
        if (user.role === "staff" && user.sectionId) {
            // Get product IDs that belong to the staff's section
            const sectionProducts = await db
                .select({ id: products.id })
                .from(products)
                .where(eq(products.sectionId, user.sectionId));

            const sectionProductIds = sectionProducts.map((p) => p.id);

            if (sectionProductIds.length === 0) {
                return NextResponse.json({ orders: [] });
            }

            // Get order IDs that contain at least one product from this section
            const relevantOrderItems = await db
                .select({ orderId: orderItems.orderId })
                .from(orderItems)
                .where(inArray(orderItems.productId, sectionProductIds));

            const relevantOrderIds = [...new Set(relevantOrderItems.map((oi) => oi.orderId))];

            if (relevantOrderIds.length === 0) {
                return NextResponse.json({ orders: [] });
            }

            const filteredOrders = await db
                .select()
                .from(orders)
                .where(inArray(orders.id, relevantOrderIds))
                .orderBy(desc(orders.createdAt));

            return NextResponse.json({ orders: filteredOrders });
        }

        // Staff without assigned section: see all (fallback)
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

        if (items.length > 50) {
            return NextResponse.json({ error: "Demasiados items en el pedido" }, { status: 400 });
        }

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

        const [newOrder] = await db
            .insert(orders)
            .values({
                userId: user.id,
                orderNumber,
                status: "pending",
                totalAmount: String(totalAmount),
                notes: typeof notes === "string" ? notes.slice(0, 500) : "",
                items: items,
                estimatedMinutes,
            })
            .returning();

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
            console.warn("Could not insert order_items:", itemError);
        }

        return NextResponse.json({ success: true, order: newOrder });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}

// PATCH — Update order status (staff/admin only)
export async function PATCH(req: NextRequest) {
    try {
        await requireRole("staff", "admin");

        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
        }

        const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
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
