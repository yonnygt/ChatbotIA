import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/schema";
import { asc, inArray } from "drizzle-orm";

// Only these sections are visible to customers
const ALLOWED_SECTIONS = ["carniceria", "charcuteria", "preparados"];

export async function GET() {
    try {
        const allSections = await db
            .select()
            .from(sections)
            .where(inArray(sections.slug, ALLOWED_SECTIONS))
            .orderBy(asc(sections.displayOrder));

        // Map sections to Category-compatible format for backward compat
        const categories = allSections.map((s) => ({
            name: s.slug,
            emoji: s.emoji,
            icon: s.icon,
            description: s.description || s.name,
            displayName: s.name,
            id: s.id,
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Error al obtener categorías" },
            { status: 500 }
        );
    }
}
