import { pgTable, serial, integer, numeric, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

// orders table — each row is one order placed by a customer (FK → customers)
export const ordersTable = pgTable("orders", {
  orderId: serial("order_id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.customerId),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull().defaultNow(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  // status: pending, processing, shipped, delivered, cancelled
  status: text("status").notNull().default("pending"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ orderId: true, orderDate: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
