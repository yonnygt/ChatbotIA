import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, parseInt(id)));

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
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
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
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
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
    }
}
