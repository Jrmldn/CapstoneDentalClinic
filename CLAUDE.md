# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

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
4. **On failure** — `enforceRole` redirects rather than throwing. [TODO: confirm exact redirect target — login? a 403 page?] Pages calling it should not wrap it in try/catch expecting a thrown error.

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

Function naming: verb-first camelCase describing the mutation, e.g. `updateAppointmentStatus`, `manageClinicHolidays`. One domain per file — don't mix e.g. appointment actions and billing actions in the same `*Actions.ts` file.

## Code Organization

- **Route-private UI** → `src/app/<dashboard>/_components/` (underscore = not a route)
- **Shared feature UI** → `src/components/features/<domain>/` — flat structure, no nested `hooks/` or `components/` subfolders. Extracted hooks, sub-components, and types live alongside existing files in the same domain folder (e.g. `usePatientRecord.ts` next to `PatientRecordModal.tsx`, not in a `patients/hooks/` subfolder).
- **Cross-domain shared hooks** (used by 2+ feature folders) → `src/hooks/`
- **Design-system primitives** → `src/components/ui/` (CVA + `cn()` from `@/lib/utils`)
- **Read-only fetchers** → `src/services/*Service.ts`; **mutations** → `src/actions/*Actions.ts`; **query builders** → `src/lib/queries/`
- Import alias: `@/` → `src/`

## Page Pattern: Server Page → Client Island

Async Server Component: (1) `enforceRole`, (2) resolve clinic/profile, (3) fetch data, (4) pass as props to a `*Client` component. Never re-derive auth client-side.

Data-heavy pages (calendar, services list, anything with unbounded Supabase queries) need `export const dynamic = 'force-dynamic'` to avoid stale prefetch caching — see ongoing performance work.

## Client Component Patterns

Follow the tab pattern: `useState` per field + `isSubmitting` flag; disable submit while submitting; on `res.success` reset + call `onRefresh()`; on failure surface `res.error`. Pass `viewerRole`, `clinicId`, `dentistId`/`patientId` as props. Supabase joined relations may type as `T | T[] | null` — normalize before rendering (e.g. a shared `normalizeRelation<T>()` util, not repeated inline `Array.isArray` checks). Modals use `createPortal` gated behind a `mounted` flag (SSR-safe).

**No native dialogs** — never use `alert()`, `confirm()`, or `window.location.reload()`. Use [TODO: confirm — toast library? a shared `<ConfirmDialog>` component?] for user-facing success/error messages and confirmations.

**Conditional className logic** — if a className ternary chain has more than 2 branches, extract it into a small named function (e.g. `getDayCellStyles(holiday, isToday, isSelected)`) returning the resolved classes, rather than inlining the chain in JSX.

## Dates

[TODO: confirm canonical date util/timezone convention — e.g. is `scheduled_at` stored UTC? Is there a shared `toDateKey()` / date-formatting helper, or should one be created in `src/lib/`? Multiple components currently hand-roll `${y}-${pad(m)}-${pad(d)}` construction inline — this should be centralized.]

## Verification

Run `npm run lint` (must pass clean), then walk the exact role/dashboard changed. State success as a concrete click-path (e.g., "submit prescription → row appears after `onRefresh`"). Confirm `revalidatePath` covers every dashboard that renders the mutated data. Run commands via the PowerShell tool (bash is sandboxed).

## Supabase

- Always use the local Supabase CLI for database schema changes and migrations.
- Migration files: `supabase/migrations/<timestamp>_<verb_noun>.sql` (e.g. `20260621_add_billing_records.sql`).
- Never execute destructive commands like `db reset` on a `--linked` remote instance.
- Ensure all custom functions follow a verb_noun naming format.

## Comments

- Never use decorative section dividers like ─────, ═════, or ****
- Just use simple single-line comments: // My comment