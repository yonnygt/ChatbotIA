const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
    const pool = new Pool({
        connectionString: "postgresql://postgres:postgres@localhost:5432/butcher_ai",
    });

    const sql = fs.readFileSync(
        path.join(__dirname, "migration_auth_pricing.sql"),
        "utf-8"
    );

    try {
        await pool.query(sql);
        console.log("✅ Migration completed successfully!");
    } catch (err) {
        console.error("❌ Migration error:", err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
