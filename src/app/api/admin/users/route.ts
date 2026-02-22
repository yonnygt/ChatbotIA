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
                sectionId: users.sectionId,
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
        const { userId, role, sectionId } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
        }

        const updateFields: Record<string, any> = {};

        if (role) {
            const validRoles = ["cliente", "staff", "admin"];
            if (!validRoles.includes(role)) {
                return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
            }
            updateFields.role = role;
        }

        // Allow setting sectionId (can be null to unassign)
        if (sectionId !== undefined) {
            updateFields.sectionId = sectionId;
        }

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
        }

        const [updated] = await db
            .update(users)
            .set(updateFields)
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                sectionId: users.sectionId,
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
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}
