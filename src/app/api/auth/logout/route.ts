import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("session_token")?.value;
        if (token) {
            await deleteSession(token);
        }

        const response = NextResponse.json({ success: true });
        response.cookies.set("session_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
    }
}
