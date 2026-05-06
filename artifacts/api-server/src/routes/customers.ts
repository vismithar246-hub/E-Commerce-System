import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
  DeleteCustomerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /customers — list all customers with optional search
router.get("/customers", async (req, res): Promise<void> => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search } = query.data;

  const customers = await db
    .select()
    .from(customersTable)
    .where(search ? ilike(customersTable.name, `%${search}%`) : undefined)
    .orderBy(customersTable.name);

  res.json(customers.map((c) => ({
    customerId: c.customerId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
  })));
});

// POST /customers — create a new customer
router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  });
});

// GET /customers/:customerId — get a single customer
router.get("/customers/:customerId", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse({ customerId: Number(req.params.customerId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.customerId, params.data.customerId));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json({
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  });
});

// PUT /customers/:customerId — update a customer
router.put("/customers/:customerId", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse({ customerId: Number(req.params.customerId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.customerId, params.data.customerId))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json({
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  });
});

// DELETE /customers/:customerId — delete a customer
router.delete("/customers/:customerId", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse({ customerId: Number(req.params.customerId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db
    .delete(customersTable)
    .where(eq(customersTable.customerId, params.data.customerId))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
