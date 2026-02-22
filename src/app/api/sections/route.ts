import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
    try {
        const allSections = await db
            .select()
            .from(sections)
            .orderBy(asc(sections.displayOrder));

        return NextResponse.json({ sections: allSections });
    } catch (error) {
        console.error("Error fetching sections:", error);
        return NextResponse.json(
            { error: "Error al obtener secciones" },
            { status: 500 }
        );
    }
}
