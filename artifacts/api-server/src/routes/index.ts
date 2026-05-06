import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import customersRouter from "./customers";
import ordersRouter from "./orders";
import inventoryRouter from "./inventory";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

// Health check
router.use(healthRouter);

// Core CRUD routes
router.use(productsRouter);
router.use(customersRouter);
router.use(ordersRouter);
router.use(inventoryRouter);

// Analytics / dashboard routes
router.use(analyticsRouter);

export default router;
