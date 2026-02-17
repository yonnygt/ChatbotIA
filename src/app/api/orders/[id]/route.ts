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
