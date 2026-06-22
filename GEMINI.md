# CLAUDE.md

Guidance for Claude Code. Bias toward caution over speed; use judgment on trivial tasks.

## Core Guidelines

1. **Think First** — State assumptions. Ask when unclear. Present tradeoffs, don't pick silently.
2. **Simplicity** — Minimum code that solves the problem. No speculative features, abstractions, or flexibility that wasn't asked for.
3. **Surgical Changes** — Touch only what's needed. Match existing style. Remove only orphans YOUR changes created; mention (don't delete) pre-existing dead code.
4. **Goal-Driven** — Define verifiable success criteria before starting. For multi-step tasks, state a brief plan: `1. [Step] → verify: [check]`.

---

# Project

Dental clinic management app. Stack: **Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind v4, Framer Motion**. Four roles: `patient`, `dentist`, `staff`, `superadmin`.

```bash
npm run dev    # http://localhost:3000
npm run build  # Production build
npm run lint   # Must pass clean before any PR
```

No test suite — verification is manual (see §Verification).

## Auth & Routing

1. **`middleware.ts`** — edge JWT check via `supabase.auth.getUser()`; reads role from `user_metadata`.
2. **`src/app/auth/callback/route.ts`** — PKCE exchange, sets `clinic_id` cookie, routes role to dashboard.
3. **`enforceRole(role)`** in `src/lib/auth/protection.ts` — DB-authoritative check at the top of every layout/page (uses React `cache()` to dedupe). Call this; never assume the session.

Two-layer design: middleware = low-latency edge guard; `enforceRole` = catches forged JWTs via `users` table query.

## Supabase Clients — Not Interchangeable

| Client | Import | Context | RLS |
|--------|--------|---------|-----|
| `supabase` | `@/lib/supabase/client` | `'use client'` only | Enforced |
| `createClient()` | `@/lib/supabase/serverSSR` | Server components / route handlers | Enforced |
| `supabaseAdmin` | `@/lib/supabase/server` | `'use server'` only — **never import client-side** | **Bypassed** |

Always confirm user with `createClient()` first, then use `supabaseAdmin` for privileged writes.

## Server Actions

Every mutating action lives in `src/actions/*Actions.ts`, starts with `'use server'`, and returns `{ success: boolean, ... }` — **never throws to client**. Wrap in try/catch; log errors; return `{ success: false, error: string }` on failure. Co-locate input interfaces in the same file and export them.

## Code Organization

- **Route-private UI** → `src/app/<dashboard>/_components/` (underscore = not a route)
- **Shared feature UI** → `src/components/features/<domain>/`
- **Design-system primitives** → `src/components/ui/` (CVA + `cn()` from `@/lib/utils`)
- **Read-only fetchers** → `src/services/*Service.ts`; **mutations** → `src/actions/*Actions.ts`; **query builders** → `src/lib/queries/`
- Import alias: `@/` → `src/`

## Page Pattern: Server Page → Client Island

Async Server Component: (1) `enforceRole`, (2) resolve clinic/profile, (3) fetch data, (4) pass as props to a `*Client` component. Never re-derive auth client-side.

## Client Component Patterns

Follow the tab pattern: `useState` per field + `isSubmitting` flag; disable submit while submitting; on `res.success` reset + call `onRefresh()`; on failure surface `res.error`. Pass `viewerRole`, `clinicId`, `dentistId`/`patientId` as props. Supabase joined relations may type as `T | T[] | null` — normalize before rendering. Modals use `createPortal` gated behind a `mounted` flag (SSR-safe).

## Verification

Run `npm run lint` (must pass clean), then walk the exact role/dashboard changed. State success as a concrete click-path (e.g., "submit prescription → row appears after `onRefresh`"). Confirm `revalidatePath` covers every dashboard that renders the mutated data. Run commands via the PowerShell tool (bash is sandboxed).

## Supabase

- Always use the local Supabase CLI for database schema changes and migrations.
- Never execute destructive commands like `db reset` on a `--linked` remote instance.
- Ensure all custom functions follow a verb_noun naming format.
