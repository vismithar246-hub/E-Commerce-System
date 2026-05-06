import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

// inventory_logs table — tracks every stock change (auto-populated on order or manual update)
export const inventoryLogsTable = pgTable("inventory_logs", {
  logId: serial("log_id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.productId),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogsTable).omit({ logId: true, updatedAt: true });
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogsTable.$inferSelect;
