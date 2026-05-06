# E-Commerce Inventory & Sales System

A full-stack DBMS mini project featuring a futuristic dark UI for browsing products, placing orders, and managing inventory with a full admin command center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ecommerce-ui run dev` — run the React frontend (port 3000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-set by Replit DB)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, Zustand (cart state), wouter routing
- API: Express 5 + Drizzle ORM
- DB: PostgreSQL (Replit managed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle table definitions (customers, products, orders, orderDetails, inventoryLogs)
- `artifacts/api-server/src/routes/` — Express route handlers (products, customers, orders, inventory, analytics)
- `artifacts/ecommerce-ui/src/pages/` — React pages (customer + admin)

## Architecture decisions

- **PostgreSQL over MySQL**: Functionally equivalent for all DBMS concepts; Replit provides managed Postgres
- **Trigger-as-code**: Order placement route auto-reduces stock and writes inventory_logs (implements TRIGGER concept in application layer)
- **Analytics via raw SQL**: Complex joins, aggregates, GROUP BY, and subqueries in `analytics.ts` routes for DBMS concept demonstration
- **Zustand for cart**: Cart state is local-only (no backend cart endpoint), converted to an order on checkout
- **Port 3000**: Changed from auto-assigned port 22674 to 3000 for workflow manager compatibility

## Product

- **Customer**: Browse products by category/search, view product details, add to cart, place orders, view order history
- **Admin**: Full product CRUD, order status management, customer directory, inventory logs with stock alerts, dashboard with charts (sales trend, category revenue, inventory by category)

## User preferences

- Tech stack specified: Node.js + Express backend, PostgreSQL DB (MySQL equivalent concepts), React+Vite frontend
- Futuristic dark theme with blue/purple gradients, glassmorphism UI
- DBMS concepts: PK/FK, joins, aggregates, normalization (3NF), triggers, GROUP BY, subqueries

## Gotchas

- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- After DB schema changes: `pnpm --filter @workspace/db run push`
- `lib/api-zod/src/index.ts` only re-exports from `./generated/api` to avoid duplicate export conflicts with `./generated/types`
- Vite 7 exits in non-TTY mode — handled via `server.stdin: false` in `vite.config.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- `artifacts/api-server/src/routes/orders.ts` — order placement + inventory auto-update (trigger concept)
- `artifacts/api-server/src/routes/analytics.ts` — all SQL aggregates, joins, GROUP BY demonstrations
