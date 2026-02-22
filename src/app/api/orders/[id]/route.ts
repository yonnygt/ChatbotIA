import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, parseInt(id)));

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Customers can only view their own orders
        if (user.role === "cliente" && order.userId !== user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Only staff/admin can update order status
        await requireRole("staff", "admin");

        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const validStatuses = ["pending", "preparing", "ready", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Status inválido" }, { status: 400 });
        }

        const [updated] = await db
            .update(orders)
            .set({ status, updatedAt: new Date() })
            .where(eq(orders.id, parseInt(id)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
        }
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
    }
}
