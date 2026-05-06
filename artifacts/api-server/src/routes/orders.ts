import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderDetailsTable,
  productsTable,
  customersTable,
  inventoryLogsTable,
} from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper: fetch a full order with its line items (JOIN query)
async function fetchOrderWithDetails(orderId: number) {
  const [order] = await db
    .select({
      orderId: ordersTable.orderId,
      customerId: ordersTable.customerId,
      customerName: customersTable.name,
      orderDate: ordersTable.orderDate,
      totalAmount: ordersTable.totalAmount,
      status: ordersTable.status,
    })
    .from(ordersTable)
    // JOIN with customers to get customer name
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.customerId))
    .where(eq(ordersTable.orderId, orderId));

  if (!order) return null;

  // Fetch line items with JOIN to products to get product names
  const items = await db
    .select({
      orderDetailId: orderDetailsTable.orderDetailId,
      productId: orderDetailsTable.productId,
      productName: productsTable.productName,
      quantity: orderDetailsTable.quantity,
      subtotal: orderDetailsTable.subtotal,
      price: productsTable.price,
    })
    .from(orderDetailsTable)
    .innerJoin(productsTable, eq(orderDetailsTable.productId, productsTable.productId))
    .where(eq(orderDetailsTable.orderId, orderId));

  return {
    orderId: order.orderId,
    customerId: order.customerId,
    customerName: order.customerName,
    orderDate: order.orderDate.toISOString(),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    items: items.map((i) => ({
      orderDetailId: i.orderDetailId,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
      price: Number(i.price),
    })),
  };
}

// GET /orders — list all orders with optional filters
router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, customerId } = query.data;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (customerId) conditions.push(eq(ordersTable.customerId, customerId));

  // JOIN with customers for customer name (demonstrates JOIN concept)
  const orders = await db
    .select({
      orderId: ordersTable.orderId,
      customerId: ordersTable.customerId,
      customerName: customersTable.name,
      orderDate: ordersTable.orderDate,
      totalAmount: ordersTable.totalAmount,
      status: ordersTable.status,
    })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.customerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${ordersTable.orderDate} DESC`);

  // Fetch items for each order
  const results = await Promise.all(
    orders.map(async (o) => {
      const items = await db
        .select({
          orderDetailId: orderDetailsTable.orderDetailId,
          productId: orderDetailsTable.productId,
          productName: productsTable.productName,
          quantity: orderDetailsTable.quantity,
          subtotal: orderDetailsTable.subtotal,
          price: productsTable.price,
        })
        .from(orderDetailsTable)
        .innerJoin(productsTable, eq(orderDetailsTable.productId, productsTable.productId))
        .where(eq(orderDetailsTable.orderId, o.orderId));

      return {
        orderId: o.orderId,
        customerId: o.customerId,
        customerName: o.customerName,
        orderDate: o.orderDate.toISOString(),
        totalAmount: Number(o.totalAmount),
        status: o.status,
        items: items.map((i) => ({
          orderDetailId: i.orderDetailId,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          subtotal: Number(i.subtotal),
          price: Number(i.price),
        })),
      };
    })
  );

  res.json(results);
});

// POST /orders — place a new order (auto-reduces stock + logs inventory)
// This implements the TRIGGER concept: stock reduction + inventory log on order creation
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerId, items } = parsed.data;

  // Validate customer exists
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.customerId, customerId));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  // Fetch all products and validate stock availability
  const productIds = items.map((i) => i.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.productId} = ANY(${sql.raw(`ARRAY[${productIds.join(",")}]::int[]`)})`)

  // Build a map for quick lookup
  const productMap = new Map(products.map((p) => [p.productId, p]));

  // Check each item has sufficient stock
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(404).json({ error: `Product ${item.productId} not found` });
      return;
    }
    if (product.stockQuantity < item.quantity) {
      res.status(400).json({
        error: `Insufficient stock for "${product.productName}". Available: ${product.stockQuantity}`,
      });
      return;
    }
  }

  // Calculate total amount using aggregate across line items
  let totalAmount = 0;
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const subtotal = Number(product.price) * item.quantity;
    totalAmount += subtotal;
    return { ...item, subtotal, price: Number(product.price) };
  });

  // Create the order
  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId,
      totalAmount: String(totalAmount),
      status: "pending",
    })
    .returning();

  // Insert order details (line items)
  await db.insert(orderDetailsTable).values(
    lineItems.map((li) => ({
      orderId: order.orderId,
      productId: li.productId,
      quantity: li.quantity,
      subtotal: String(li.subtotal),
    }))
  );

  // TRIGGER behavior: reduce stock and log inventory change for each product
  await Promise.all(
    lineItems.map(async (li) => {
      const product = productMap.get(li.productId)!;
      const newStock = product.stockQuantity - li.quantity;

      // Log inventory change (implements inventory_logs requirement)
      await db.insert(inventoryLogsTable).values({
        productId: li.productId,
        stockBefore: product.stockQuantity,
        stockAfter: newStock,
      });

      // Reduce stock quantity in products table (auto-update after order)
      await db
        .update(productsTable)
        .set({ stockQuantity: newStock })
        .where(eq(productsTable.productId, li.productId));
    })
  );

  const result = await fetchOrderWithDetails(order.orderId);
  res.status(201).json(result);
});

// GET /orders/:orderId — get order details
router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ orderId: Number(req.params.orderId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await fetchOrderWithDetails(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
});

// PUT /orders/:orderId — update order status
router.put("/orders/:orderId", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse({ orderId: Number(req.params.orderId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.orderId, params.data.orderId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const order = await fetchOrderWithDetails(updated.orderId);
  res.json(order);
});

export default router;
