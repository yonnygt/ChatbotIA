const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function fixAdmin() {
    const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/butcher_ai" });
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE email='admin@butcherai.com'", [hash]);
    console.log("Admin password updated");
    await pool.end();
}

fixAdmin();
