import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webauthnCredentials, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

// POST /api/auth/webauthn/authenticate
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, credentialId, email } = body;

        if (action === "options") {
            // Generate authentication challenge
            const challenge = crypto.randomBytes(32).toString("base64url");

            // If email provided, find allowed credentials for that user
            let allowCredentials: { id: string; type: string }[] = [];
            if (email) {
                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email.toLowerCase().trim()));

                if (user) {
                    const creds = await db
                        .select()
                        .from(webauthnCredentials)
                        .where(eq(webauthnCredentials.userId, user.id));

                    allowCredentials = creds.map((c) => ({
                        id: c.credentialId,
                        type: "public-key" as const,
                    }));
                }
            }

            const response = NextResponse.json({
                challenge,
                rpId: req.headers.get("host")?.split(":")[0] || "localhost",
                allowCredentials,
                userVerification: "required",
                timeout: 60000,
            });

            response.cookies.set("webauthn_auth_challenge", challenge, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 120,
                path: "/",
            });

            return response;
        }

        if (action === "verify") {
            if (!credentialId) {
                return NextResponse.json({ error: "Credencial requerida" }, { status: 400 });
            }

            // Find the credential in DB
            const [cred] = await db
                .select()
                .from(webauthnCredentials)
                .where(eq(webauthnCredentials.credentialId, credentialId));

            if (!cred) {
                return NextResponse.json({ error: "Credencial no encontrada" }, { status: 401 });
            }

            // Update counter for replay protection
            await db
                .update(webauthnCredentials)
                .set({ counter: cred.counter + 1 })
                .where(eq(webauthnCredentials.id, cred.id));

            // Get the user
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, cred.userId));

            if (!user) {
                return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
            }

            // Create session
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

            // Clear challenge cookie
            response.cookies.delete("webauthn_auth_challenge");

            return response;
        }

        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } catch (error) {
        console.error("WebAuthn auth error:", error);
        return NextResponse.json({ error: "Error de autenticación biométrica" }, { status: 500 });
    }
}
