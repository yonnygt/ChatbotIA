import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        let query = db.select().from(products);

        if (category) {
            query = query.where(eq(products.category, category)) as typeof query;
        }

        const result = await query;
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, category, price, unit, imageUrl, sku, location, inStock, taxType } = body;

        if (!name || !category || !price) {
            return NextResponse.json(
                { error: "Nombre, categoría y precio son requeridos" },
                { status: 400 }
            );
        }

        const [product] = await db
            .insert(products)
            .values({
                name,
                description: description || null,
                category,
                price: String(price),
                unit: unit || "kg",
                imageUrl: imageUrl || null,
                sku: sku || null,
                location: location || null,
                inStock: inStock !== undefined ? inStock : true,
                taxType: taxType || "gravado",
            })
            .returning();

        return NextResponse.json({ success: true, product }, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
        }

        // Only allow updating specific fields
        const allowedFields: Record<string, any> = {};
        if (updates.name !== undefined) allowedFields.name = updates.name;
        if (updates.description !== undefined) allowedFields.description = updates.description;
        if (updates.category !== undefined) allowedFields.category = updates.category;
        if (updates.price !== undefined) allowedFields.price = String(updates.price);
        if (updates.unit !== undefined) allowedFields.unit = updates.unit;
        if (updates.imageUrl !== undefined) allowedFields.imageUrl = updates.imageUrl;
        if (updates.sku !== undefined) allowedFields.sku = updates.sku;
        if (updates.location !== undefined) allowedFields.location = updates.location;
        if (updates.inStock !== undefined) allowedFields.inStock = updates.inStock;
        if (updates.taxType !== undefined) allowedFields.taxType = updates.taxType;

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
        }

        const [updated] = await db
            .update(products)
            .set(allowedFields)
            .where(eq(products.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
        }

        const [deleted] = await db
            .delete(products)
            .where(eq(products.id, parseInt(id)))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
    }
}
