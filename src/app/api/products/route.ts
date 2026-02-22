import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, sections } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const sectionSlug = searchParams.get("section");

        // Join with sections to get section name
        const query = db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                category: products.category,
                sectionId: products.sectionId,
                sectionName: sections.name,
                price: products.price,
                priceVes: products.priceVes,
                unit: products.unit,
                imageUrl: products.imageUrl,
                sku: products.sku,
                location: products.location,
                inStock: products.inStock,
                taxType: products.taxType,
                createdAt: products.createdAt,
            })
            .from(products)
            .leftJoin(sections, eq(products.sectionId, sections.id));

        // Filter by section slug or legacy category
        if (sectionSlug) {
            const result = await query.where(eq(sections.slug, sectionSlug));
            return NextResponse.json(result);
        } else if (category) {
            const result = await query.where(eq(products.category, category));
            return NextResponse.json(result);
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
        const { name, description, category, sectionId, price, unit, imageUrl, sku, location, inStock, taxType } = body;

        if (!name || !price) {
            return NextResponse.json(
                { error: "Nombre y precio son requeridos" },
                { status: 400 }
            );
        }

        // If sectionId provided, get section name for category field
        let categoryValue = category || "general";
        if (sectionId) {
            const [section] = await db
                .select({ slug: sections.slug })
                .from(sections)
                .where(eq(sections.id, sectionId));
            if (section) categoryValue = section.slug;
        }

        const [product] = await db
            .insert(products)
            .values({
                name,
                description: description || null,
                category: categoryValue,
                sectionId: sectionId || null,
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
        if (updates.sectionId !== undefined) allowedFields.sectionId = updates.sectionId;
        if (updates.price !== undefined) allowedFields.price = String(updates.price);
        if (updates.unit !== undefined) allowedFields.unit = updates.unit;
        if (updates.imageUrl !== undefined) allowedFields.imageUrl = updates.imageUrl;
        if (updates.sku !== undefined) allowedFields.sku = updates.sku;
        if (updates.location !== undefined) allowedFields.location = updates.location;
        if (updates.inStock !== undefined) allowedFields.inStock = updates.inStock;
        if (updates.taxType !== undefined) allowedFields.taxType = updates.taxType;

        // If sectionId updated, also update the category slug
        if (updates.sectionId) {
            const [section] = await db
                .select({ slug: sections.slug })
                .from(sections)
                .where(eq(sections.id, updates.sectionId));
            if (section) allowedFields.category = section.slug;
        }

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
