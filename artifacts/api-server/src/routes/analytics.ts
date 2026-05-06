import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db, ordersTable, orderDetailsTable, productsTable, customersTable, inventoryLogsTable } from "@workspace/db";

const router: IRouter = Router();

const LOW_STOCK_THRESHOLD = 10;

// GET /analytics/dashboard — aggregate stats for the admin dashboard
// Demonstrates: Aggregate Functions (COUNT, SUM), Subqueries
router.get("/analytics/dashboard", async (_req, res): Promise<void> => {
  // Use parallel queries for speed
  const [
    productCount,
    orderCount,
    revenueResult,
    customerCount,
    lowStockResult,
    pendingResult,
  ] = await Promise.all([
    // Total products (COUNT aggregate)
    db.select({ count: sql<number>`COUNT(*)::int` }).from(productsTable),
    // Total orders
    db.select({ count: sql<number>`COUNT(*)::int` }).from(ordersTable),
    // Total revenue (SUM aggregate)
    db.select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` }).from(ordersTable),
    // Total customers
    db.select({ count: sql<number>`COUNT(*)::int` }).from(customersTable),
    // Low stock products (Subquery concept: filter with threshold)
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(productsTable)
      .where(sql`stock_quantity <= ${LOW_STOCK_THRESHOLD}`),
    // Pending orders
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(ordersTable)
      .where(sql`status = 'pending'`),
  ]);

  res.json({
    totalProducts: productCount[0].count,
    totalOrders: orderCount[0].count,
    totalRevenue: Number(revenueResult[0].total),
    totalCustomers: customerCount[0].count,
    lowStockCount: lowStockResult[0].count,
    pendingOrders: pendingResult[0].count,
  });
});

// GET /analytics/top-products — top selling products by revenue
// Demonstrates: GROUP BY, ORDER BY, JOIN, Aggregate Functions
router.get("/analytics/top-products", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit) || 5;

  // JOIN order_details + products, GROUP BY product, aggregate totals
  const result = await db
    .select({
      productId: productsTable.productId,
      productName: productsTable.productName,
      category: productsTable.category,
      totalSold: sql<number>`SUM(${orderDetailsTable.quantity})::int`,
      totalRevenue: sql<string>`SUM(${orderDetailsTable.subtotal})`,
    })
    .from(orderDetailsTable)
    .innerJoin(productsTable, sql`${orderDetailsTable.productId} = ${productsTable.productId}`)
    .groupBy(productsTable.productId, productsTable.productName, productsTable.category)
    .orderBy(desc(sql`SUM(${orderDetailsTable.subtotal})`))
    .limit(limit);

  res.json(
    result.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      category: r.category,
      totalSold: r.totalSold ?? 0,
      totalRevenue: Number(r.totalRevenue ?? 0),
    }))
  );
});

// GET /analytics/sales-by-category — total sales grouped by category
// Demonstrates: JOIN, GROUP BY, Aggregate Functions
router.get("/analytics/sales-by-category", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      category: productsTable.category,
      totalOrders: sql<number>`COUNT(DISTINCT ${orderDetailsTable.orderId})::int`,
      totalRevenue: sql<string>`SUM(${orderDetailsTable.subtotal})`,
    })
    .from(orderDetailsTable)
    .innerJoin(productsTable, sql`${orderDetailsTable.productId} = ${productsTable.productId}`)
    .groupBy(productsTable.category)
    .orderBy(desc(sql`SUM(${orderDetailsTable.subtotal})`));

  res.json(
    result.map((r) => ({
      category: r.category,
      totalOrders: r.totalOrders ?? 0,
      totalRevenue: Number(r.totalRevenue ?? 0),
    }))
  );
});

// GET /analytics/sales-trend — daily revenue over the last N days
// Demonstrates: GROUP BY with date truncation, time-series query
router.get("/analytics/sales-trend", async (req, res): Promise<void> => {
  const days = Number(req.query.days) || 30;

  const result = await db
    .select({
      date: sql<string>`TO_CHAR(DATE_TRUNC('day', ${ordersTable.orderDate}), 'YYYY-MM-DD')`,
      totalRevenue: sql<string>`SUM(${ordersTable.totalAmount})`,
      totalOrders: sql<number>`COUNT(*)::int`,
    })
    .from(ordersTable)
    .where(sql`${ordersTable.orderDate} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`)
    .groupBy(sql`DATE_TRUNC('day', ${ordersTable.orderDate})`)
    .orderBy(sql`DATE_TRUNC('day', ${ordersTable.orderDate})`);

  res.json(
    result.map((r) => ({
      date: r.date,
      totalRevenue: Number(r.totalRevenue ?? 0),
      totalOrders: r.totalOrders ?? 0,
    }))
  );
});

// GET /analytics/top-customers — customers with highest total purchases
// Demonstrates: JOIN, GROUP BY, Aggregate, ORDER BY with Subquery concept
router.get("/analytics/top-customers", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit) || 5;

  const result = await db
    .select({
      customerId: customersTable.customerId,
      name: customersTable.name,
      email: customersTable.email,
      totalOrders: sql<number>`COUNT(${ordersTable.orderId})::int`,
      totalSpent: sql<string>`SUM(${ordersTable.totalAmount})`,
    })
    .from(customersTable)
    .innerJoin(ordersTable, sql`${ordersTable.customerId} = ${customersTable.customerId}`)
    .groupBy(customersTable.customerId, customersTable.name, customersTable.email)
    .orderBy(desc(sql`SUM(${ordersTable.totalAmount})`))
    .limit(limit);

  res.json(
    result.map((r) => ({
      customerId: r.customerId,
      name: r.name,
      email: r.email,
      totalOrders: r.totalOrders ?? 0,
      totalSpent: Number(r.totalSpent ?? 0),
    }))
  );
});

// GET /analytics/inventory-status — inventory breakdown by category
// Demonstrates: GROUP BY, Aggregate Functions, conditional aggregation
router.get("/analytics/inventory-status", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      category: productsTable.category,
      totalStock: sql<number>`SUM(${productsTable.stockQuantity})::int`,
      productCount: sql<number>`COUNT(*)::int`,
      // Conditional aggregate: count products where stock <= threshold (low stock alert)
      lowStockCount: sql<number>`SUM(CASE WHEN ${productsTable.stockQuantity} <= ${LOW_STOCK_THRESHOLD} THEN 1 ELSE 0 END)::int`,
    })
    .from(productsTable)
    .groupBy(productsTable.category)
    .orderBy(productsTable.category);

  res.json(
    result.map((r) => ({
      category: r.category,
      totalStock: r.totalStock ?? 0,
      productCount: r.productCount ?? 0,
      lowStockCount: r.lowStockCount ?? 0,
    }))
  );
});

export default router;
