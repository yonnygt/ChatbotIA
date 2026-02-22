import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Increased for 200+ concurrent users
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
});

export const db = drizzle(pool, { schema });
