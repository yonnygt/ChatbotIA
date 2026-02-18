import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        await requireRole("admin");

        const allUsers = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users);

        return NextResponse.json(allUsers);
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        if (error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
        console.error("Error listing users:", error);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await requireRole("admin");

        const body = await req.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json({ error: "userId y role son requeridos" }, { status: 400 });
        }

        const validRoles = ["cliente", "staff", "admin"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
        }

        const [updated] = await db
            .update(users)
            .set({ role })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
            });

        if (!updated) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updated });
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        if (error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
        console.error("Error updating user role:", error);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}
