import { pgTable, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { productsTable } from "./products";

// order_details table — line items for each order (FK → orders, FK → products)
export const orderDetailsTable = pgTable("order_details", {
  orderDetailId: serial("order_detail_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.orderId),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.productId),
  quantity: integer("quantity").notNull(),
  // subtotal = quantity × price at time of order
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const insertOrderDetailSchema = createInsertSchema(orderDetailsTable).omit({ orderDetailId: true });
export type InsertOrderDetail = z.infer<typeof insertOrderDetailSchema>;
export type OrderDetail = typeof orderDetailsTable.$inferSelect;
