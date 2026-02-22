import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 3 registrations per IP every 10 minutes
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
        const { limited, retryAfter } = rateLimit(`register_${ip}`, 3, 600000);
        if (limited) {
            return NextResponse.json(
                { error: `Demasiados intentos. Espera ${retryAfter} segundos.` },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, contraseña y nombre son requeridos" },
                { status: 400 }
            );
        }

        // Email validation
        if (typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 320) {
            return NextResponse.json(
                { error: "Email inválido" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "La contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            );
        }

        if (password.length > 128) {
            return NextResponse.json(
                { error: "La contraseña es demasiado larga" },
                { status: 400 }
            );
        }

        // Sanitize name
        const sanitizedName = String(name).trim().slice(0, 100);
        if (sanitizedName.length < 2) {
            return NextResponse.json(
                { error: "El nombre debe tener al menos 2 caracteres" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()));

        if (existing) {
            return NextResponse.json(
                { error: "Ya existe un usuario con este email" },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const [user] = await db
            .insert(users)
            .values({
                email: email.toLowerCase().trim(),
                passwordHash,
                name: sanitizedName,
                role: "cliente",
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
            });

        // Create session
        const token = await createSession(user.id);

        const response = NextResponse.json({ user });
        response.cookies.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60, // 30 days
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
        console.error("Register error:", error);
        return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
    }
}
