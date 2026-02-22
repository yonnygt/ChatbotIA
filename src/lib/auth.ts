import { db } from "./db";
import { users, sessions } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

// ─── Password Helpers ────────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── Session Helpers ─────────────────────────────
function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
        token,
        userId,
        expiresAt,
    });

    return token;
}

export async function getSessionUser(token: string) {
    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token));

    if (!session || new Date(session.expiresAt) < new Date()) {
        if (session) {
            await db.delete(sessions).where(eq(sessions.token, token));
        }
        return null;
    }

    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, session.userId));

    return user || null;
}

export async function deleteSession(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
}

// ─── Auth Middleware Helpers ─────────────────────

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;
    return getSessionUser(token);
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("UNAUTHORIZED");
    }
    return user;
}

export async function requireRole(...roles: string[]) {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }
    return user;
}
