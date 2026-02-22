import pg from "pg";

const pool = new pg.Pool({
    connectionString: "postgresql://postgres:postgres@localhost:5432/butcher_ai",
});

async function main() {
    try {
        // 1. Insert sections
        const insertRes = await pool.query(`
            INSERT INTO sections (name, slug, emoji, icon, description, display_order) VALUES
            ('Carnicería',         'carniceria',         '🥩', 'lunch_dining',  'Cortes frescos de res, cerdo y pollo',  1),
            ('Charcutería',        'charcuteria',        '🍖', 'bakery_dining', 'Jamones, salamis y embutidos selectos', 2),
            ('Panadería',          'panaderia',          '🥖', 'bakery_dining', 'Panes frescos, dulces y repostería',   3),
            ('Lácteos',            'lacteos',            '🧀', 'egg_alt',       'Leches, quesos y yogures',             4),
            ('Preparados',         'preparados',         '🍗', 'skillet',       'Platos listos y marinados',            5),
            ('Bebidas',            'bebidas',            '🥤', 'local_cafe',    'Refrescos, jugos y agua',              6),
            ('Frutas y Verduras',  'frutas-y-verduras',  '🥬', 'eco',           'Frutas y vegetales frescos',           7),
            ('Abarrotes',          'abarrotes',          '🛒', 'shopping_cart',  'Productos de despensa y hogar',       8)
            ON CONFLICT (slug) DO NOTHING
        `);
        console.log("Sections inserted:", insertRes.rowCount);

        // 2. Show sections
        const sectionsRes = await pool.query("SELECT id, name, slug FROM sections ORDER BY display_order");
        console.log("Sections:", sectionsRes.rows);

        // 3. Map existing product categories to section IDs
        const categoryToSlug = {
            carnes: "carniceria",
            "charcutería": "charcuteria",
            preparados: "preparados",
            "lácteos": "lacteos",
            "panadería": "panaderia",
            bebidas: "bebidas",
            abarrotes: "abarrotes",
        };

        for (const [cat, slug] of Object.entries(categoryToSlug)) {
            const updateRes = await pool.query(
                `UPDATE products SET section_id = (SELECT id FROM sections WHERE slug = $1) WHERE LOWER(category) = LOWER($2) AND section_id IS NULL`,
                [slug, cat]
            );
            if (updateRes.rowCount > 0) {
                console.log(`Mapped ${updateRes.rowCount} products from "${cat}" → section "${slug}"`);
            }
        }

        // 4. Map any unmapped products to Carnicería as default
        const defaultRes = await pool.query(
            `UPDATE products SET section_id = (SELECT id FROM sections WHERE slug = 'carniceria') WHERE section_id IS NULL`
        );
        if (defaultRes.rowCount > 0) {
            console.log(`Mapped ${defaultRes.rowCount} unmapped products to "carniceria" (default)`);
        }

        // 5. Summary
        const summary = await pool.query(`
            SELECT s.name as section, COUNT(p.id) as product_count
            FROM sections s
            LEFT JOIN products p ON p.section_id = s.id
            GROUP BY s.name, s.display_order
            ORDER BY s.display_order
        `);
        console.log("\nProducts per section:");
        summary.rows.forEach((r) => console.log(`  ${r.section}: ${r.product_count}`));

        console.log("\n✅ Migration complete!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

main();
