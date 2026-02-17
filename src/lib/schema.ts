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

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }).default("kg"),
    imageUrl: text("image_url"),
    sku: varchar("sku", { length: 50 }),
    location: varchar("location", { length: 100 }),
    inStock: boolean("in_stock").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }),
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

export const qrSessions = pgTable("qr_sessions", {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    orderId: integer("order_id").references(() => orders.id),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
