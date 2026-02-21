import {
    pgTable,
    serial,
    varchar,
    text,
    numeric,
    boolean,
    timestamp,
    jsonb,
    integer,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("cliente"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Sessions ────────────────────────────────────
export const sessions = pgTable("sessions", {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Products ────────────────────────────────────
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    priceVes: numeric("price_ves", { precision: 20, scale: 4 }),
    unit: varchar("unit", { length: 50 }).default("kg"),
    imageUrl: text("image_url"),
    sku: varchar("sku", { length: 50 }),
    location: varchar("location", { length: 100 }),
    inStock: boolean("in_stock").default(true),
    taxType: varchar("tax_type", { length: 20 }).default("gravado"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Orders ──────────────────────────────────────
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    priority: varchar("priority", { length: 10 }).default("normal"),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    items: jsonb("items"),
    notes: text("notes"),
    estimatedMinutes: integer("estimated_minutes"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Order Items ─────────────────────────────────
export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
        .references(() => orders.id)
        .notNull(),
    productId: integer("product_id")
        .references(() => products.id)
        .notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
});

// ─── QR Sessions ─────────────────────────────────
export const qrSessions = pgTable("qr_sessions", {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    orderId: integer("order_id").references(() => orders.id),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ─── Exchange Rates ──────────────────────────────
export const exchangeRates = pgTable("exchange_rates", {
    id: serial("id").primaryKey(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    rateVes: numeric("rate_ves", { precision: 20, scale: 4 }).notNull(),
    source: varchar("source", { length: 50 }).default("BCV"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
});

// ─── Favorites ───────────────────────────────────
export const favorites = pgTable("favorites", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    productId: integer("product_id")
        .references(() => products.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
