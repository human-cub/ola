# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OLA (alaola.com.ar) is a sports supplements e-commerce SPA with a collective/group-buying model where retail customers buy at wholesale prices. All UI text is in Spanish (Argentine market).

## Commands

```bash
npm run dev          # Dev server on port 8517
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (SWC)
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS 3
- **State**: React Query (server state), CartContext (global cart/waiting list), React Hook Form + Zod (forms)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel (SPA rewrites in `vercel.json`)

## Architecture

### Path Alias
`@/` maps to `./src/` (configured in `tsconfig.json` and `vite.config.ts`).

### Key Directories
- `src/pages/` — Route-level page components (Spanish route names: `/catalogo`, `/carrito`, `/ingresar`)
- `src/components/` — Reusable components; `components/ui/` holds shadcn/ui primitives; `components/admin/` holds admin dashboard components
- `src/contexts/CartContext.tsx` — Global cart and waiting list state; handles both guest (session_id) and authenticated (user_id) users via Supabase
- `src/hooks/useProducts.ts` — React Query hook with Supabase real-time subscription for automatic product cache invalidation
- `src/lib/collectivePricing.ts` — Core business logic: tiered pricing calculation, weekly deadline freezing (Sunday 23:59), dynamic vs frozen pricing rules
- `src/data/products.ts` — Static product definitions with price tiers (synced to Supabase via `sync-products` function)
- `src/integrations/supabase/` — Auto-generated Supabase client and TypeScript types (do not edit `types.ts` manually)

### Routing
Routes defined in `src/App.tsx`. Short links (`/s1`–`/s6`) redirect to marketing UTM URLs. Product pages use `/producto/:slug` with a catch-all `/:slug` that checks short links first.

### Collective Order System
The central business feature: users join a "waiting list" for products. Prices drop through tiers as more participants join (e.g., 1/25/50/75/100+ people). Orders freeze after the weekly Sunday 23:59 deadline — after that, `participants_count` snapshots are stored and prices stop updating dynamically. Logic lives in `collectivePricing.ts` (`shouldUseDynamicCollectivePricing`, `isCollectiveOrderFrozen`, `getCollectiveTierPrice`).

### Database
Supabase tables: `products` (prices as JSONB array of `{people, price}`), `cart_items`, `waiting_list_items`, `user_orders`, `profiles`, `user_roles`, `login_history`. Database triggers auto-update `waiting_for_discount_count` on order changes. RLS enforces user data isolation.

### TypeScript Config
Loose checking: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`.

### Environment Variables
Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
