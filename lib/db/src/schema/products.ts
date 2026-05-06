import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// products table — stores product catalog and inventory quantities
export const productsTable = pgTable("products", {
  productId: serial("product_id").primaryKey(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  // price stored as numeric for precision
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  description: text("description").notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ productId: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
