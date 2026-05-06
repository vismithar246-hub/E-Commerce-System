import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, inventoryLogsTable, productsTable } from "@workspace/db";
import { ListInventoryLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /inventory/logs — list inventory change logs (JOIN with products for name)
router.get("/inventory/logs", async (req, res): Promise<void> => {
  const query = ListInventoryLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { productId } = query.data;

  // JOIN query: inventory_logs + products to get product name
  const logs = await db
    .select({
      logId: inventoryLogsTable.logId,
      productId: inventoryLogsTable.productId,
      productName: productsTable.productName,
      stockBefore: inventoryLogsTable.stockBefore,
      stockAfter: inventoryLogsTable.stockAfter,
      updatedAt: inventoryLogsTable.updatedAt,
    })
    .from(inventoryLogsTable)
    .innerJoin(productsTable, eq(inventoryLogsTable.productId, productsTable.productId))
    .where(productId ? eq(inventoryLogsTable.productId, productId) : undefined)
    .orderBy(inventoryLogsTable.updatedAt);

  res.json(
    logs.map((l) => ({
      logId: l.logId,
      productId: l.productId,
      productName: l.productName,
      stockBefore: l.stockBefore,
      stockAfter: l.stockAfter,
      updatedAt: l.updatedAt.toISOString(),
    }))
  );
});

export default router;
