import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, productsTable, inventoryLogsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// LOW_STOCK_THRESHOLD — products below this quantity are flagged as low stock
const LOW_STOCK_THRESHOLD = 10;

// Helper: attach isLowStock flag to a product row
function withLowStock(p: typeof productsTable.$inferSelect) {
  return {
    productId: p.productId,
    productName: p.productName,
    category: p.category,
    price: Number(p.price),
    stockQuantity: p.stockQuantity,
    description: p.description,
    isLowStock: p.stockQuantity <= LOW_STOCK_THRESHOLD,
  };
}

// GET /products — list all products with optional filters
router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, search, lowStock } = query.data;

  // Build conditions array for WHERE clause (demonstrates Joins/Filters)
  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (search) conditions.push(ilike(productsTable.productName, `%${search}%`));
  if (lowStock) conditions.push(sql`${productsTable.stockQuantity} <= ${LOW_STOCK_THRESHOLD}`);

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(productsTable.productName);

  res.json(products.map(withLowStock));
});

// POST /products — create a new product
router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      productName: parsed.data.productName,
      category: parsed.data.category,
      price: String(parsed.data.price),
      stockQuantity: parsed.data.stockQuantity,
      description: parsed.data.description,
    })
    .returning();

  res.status(201).json(withLowStock(product));
});

// GET /products/categories — list unique categories (must be before /:productId)
router.get("/products/categories", async (_req, res): Promise<void> => {
  const result = await db
    .selectDistinct({ category: productsTable.category })
    .from(productsTable)
    .orderBy(productsTable.category);

  res.json(result.map((r) => r.category));
});

// GET /products/:productId — get single product
router.get("/products/:productId", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse({ productId: Number(req.params.productId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.productId, params.data.productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(withLowStock(product));
});

// PUT /products/:productId — update a product
router.put("/products/:productId", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse({ productId: Number(req.params.productId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({
      productName: parsed.data.productName,
      category: parsed.data.category,
      price: String(parsed.data.price),
      stockQuantity: parsed.data.stockQuantity,
      description: parsed.data.description,
    })
    .where(eq(productsTable.productId, params.data.productId))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(withLowStock(product));
});

// DELETE /products/:productId — delete a product
router.delete("/products/:productId", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse({ productId: Number(req.params.productId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.productId, params.data.productId))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /inventory/update — manually update stock, logs the change
router.post("/inventory/update", async (req, res): Promise<void> => {
  const { UpdateInventoryBody } = await import("@workspace/api-zod");
  const parsed = UpdateInventoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, newStock } = parsed.data;

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.productId, productId));

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Log inventory change before updating
  await db.insert(inventoryLogsTable).values({
    productId,
    stockBefore: existing.stockQuantity,
    stockAfter: newStock,
  });

  const [updated] = await db
    .update(productsTable)
    .set({ stockQuantity: newStock })
    .where(eq(productsTable.productId, productId))
    .returning();

  res.json(withLowStock(updated));
});

export default router;
