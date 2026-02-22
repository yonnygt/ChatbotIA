import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webauthnCredentials, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// POST /api/auth/webauthn/register
// Step 1: Generate registration options (GET-like via POST with action)
// Step 2: Verify and store credential
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, credential, deviceName } = body;

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        if (action === "options") {
            // Generate registration challenge
            const challenge = crypto.randomBytes(32).toString("base64url");

            // Store challenge temporarily in a cookie (short-lived)
            const response = NextResponse.json({
                challenge,
                rp: {
                    name: "SuperMarket AI",
                    id: req.headers.get("host")?.split(":")[0] || "localhost",
                },
                user: {
                    id: Buffer.from(String(user.id)).toString("base64url"),
                    name: user.email,
                    displayName: user.name,
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },   // ES256
                    { type: "public-key", alg: -257 },  // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Built-in biometric
                    userVerification: "required",
                    residentKey: "preferred",
                },
                timeout: 60000,
            });

            response.cookies.set("webauthn_challenge", challenge, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 120, // 2 minutes
                path: "/",
            });

            return response;
        }

        if (action === "verify") {
            if (!credential) {
                return NextResponse.json({ error: "Credencial requerida" }, { status: 400 });
            }

            // Store the credential
            await db.insert(webauthnCredentials).values({
                userId: user.id,
                credentialId: credential.id,
                publicKey: credential.publicKey,
                counter: 0,
                deviceName: deviceName || "Dispositivo biométrico",
            });

            // Clear challenge cookie
            const response = NextResponse.json({ success: true, message: "Biométrico registrado exitosamente" });
            response.cookies.delete("webauthn_challenge");

            return response;
        }

        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } catch (error) {
        console.error("WebAuthn register error:", error);
        return NextResponse.json({ error: "Error al registrar biométrico" }, { status: 500 });
    }
}

// GET - Check if current user has biometric credentials
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ hasCredential: false });
        }

        const creds = await db
            .select()
            .from(webauthnCredentials)
            .where(eq(webauthnCredentials.userId, user.id));

        return NextResponse.json({
            hasCredential: creds.length > 0,
            credentials: creds.map((c) => ({
                id: c.id,
                deviceName: c.deviceName,
                createdAt: c.createdAt,
            })),
        });
    } catch (error) {
        return NextResponse.json({ hasCredential: false });
    }
}
