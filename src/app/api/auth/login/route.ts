import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Brute-force protection: 5 login attempts per IP every 5 minutes
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
        const { limited, retryAfter } = rateLimit(`login_${ip}`, 5, 300000);
        if (limited) {
            return NextResponse.json(
                { error: `Demasiados intentos. Espera ${retryAfter} segundos.` },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email y contraseña son requeridos" },
                { status: 400 }
            );
        }

        // Basic email format validation
        if (typeof email !== "string" || email.length > 320) {
            return NextResponse.json(
                { error: "Email inválido" },
                { status: 400 }
            );
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()));

        if (!user) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        const token = await createSession(user.id);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });

        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
        });

        response.cookies.set("user_role", user.role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
    }
}
