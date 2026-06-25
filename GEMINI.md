# Rules

## General
- State assumptions explicitly; ask if uncertain.
- Present multiple interpretations rather than picking silently.
- Minimum code to solve the problem — no speculative features, unused flexibility, or impossible-case error handling.
- Touch only what the request requires. No unrelated refactors/reformatting.
- Match existing style even if you'd choose differently.
- Remove only imports/vars your own change orphaned. Mention, don't delete, pre-existing dead code.
- For multi-step work, state a brief plan with verification steps per step.
- `npm run lint` must pass clean before any PR.
- Flatten nested conditionals into early-return guard clauses (`if (!x) return`), not 3-level nesting. Applies everywhere — server actions, services, query builders, components — not just client components.

## Stack
Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind v4, Framer Motion.
Roles: `patient`, `dentist`, `staff`, `superadmin`.

## Auth & Routing
- `middleware.ts` — edge JWT check via `supabase.auth.getUser()`, role from `user_metadata`.
- `src/app/auth/callback/route.ts` — PKCE exchange, sets `clinic_id` cookie, routes by role.
- Call `enforceRole(role)` (`src/lib/auth/protection.ts`) at the top of every layout/page. Never assume the session.
- `enforceRole` redirects on failure, does not throw — never wrap in try/catch expecting a throw.

## Supabase Clients
- `supabase` (`@/lib/supabase/client`) — `'use client'` only. RLS enforced.
- `createClient()` (`@/lib/supabase/serverSSR`) — server components/routes. RLS enforced.
- `supabaseAdmin` (`@/lib/supabase/server`) — `'use server'` only, never client-side. RLS bypassed.
- Confirm user via `createClient()` first; use `supabaseAdmin` only after, for privileged writes.

## Server Actions
- Location: `src/actions/*Actions.ts`. Start with `'use server'`.
- Return `{ success: boolean, ... }` — never throw to client. Wrap in try/catch, log, return `{ success: false, error }` on failure.
- Co-locate and export input interfaces in the same file.
- Verb-first camelCase naming (e.g. `updateAppointmentStatus`).
- One domain per file.

## Code Organization
- Route-private UI → `src/app/<dashboard>/_components/`
- Shared feature UI → `src/components/features/<domain>/` — flat, no `hooks/`/`components/` subfolders. Extracted hooks/sub-components live alongside (e.g. `usePatientRecord.ts` next to `PatientRecordModal.tsx`).
- Cross-domain shared hooks → `src/hooks/`
- Design-system primitives → `src/components/ui/` (CVA + `cn()`)
- Fetchers → `src/services/*Service.ts`
- Mutations → `src/actions/*Actions.ts`
- Query builders → `src/lib/queries/`
- Import alias `@/` → `src/`

## Page Pattern
- Server Component order: `enforceRole` → resolve clinic/profile → fetch data → pass as props to `*Client`.
- Never re-derive auth client-side.
- Pages with unbounded queries (calendar, lists) require `export const dynamic = 'force-dynamic'`.

## Client Component Patterns
- Tab pattern: per-field `useState` + `isSubmitting` flag. Disable submit while submitting. On success: reset + `onRefresh()`. On failure: surface `res.error`.
- Props: `viewerRole`, `clinicId`, `dentistId`/`patientId`.
- Normalize Supabase relations (`T | T[] | null`) via shared `normalizeRelation<T>()`. Never inline `Array.isArray` checks or `as any`.
- Modals: `createPortal`, gated behind a `mounted` flag (SSR-safe). Required for all modals.
- No native dialogs (`alert()`, `confirm()`, `window.location.reload()`). [TODO: toast vs. `<ConfirmDialog>` — pending]
- ClassName ternary with >2 branches → extract to a named function (e.g. `getDayCellStyles(...)`). Never inline in JSX.
- Shared interfaces used in 2+ files → shared types file, not redefined per-file.
- Remove decorative-only UI (e.g. non-functional dividers) during refactors.

## Dates
[TODO: confirm canonical date util/timezone convention — UTC storage? shared `toDateKey()`?]

## Verification
- `npm run lint` clean.
- Run the relevant tests after a successful implementation of a feature or function.
- Walk the exact role/dashboard changed.
- State success as a concrete click-path.
- Confirm `revalidatePath` covers every dashboard rendering the mutated data.
- Run commands via PowerShell (bash is sandboxed).

## Supabase
- Use local Supabase CLI for schema changes/migrations.
- Migration filenames: `supabase/migrations/<timestamp>_<verb_noun>.sql`
- Never run destructive commands (`db reset`) on a `--linked` remote.
- Custom functions: `verb_noun` naming.

## Comments
- No decorative dividers (`────`, `════`, `****`).
- Single-line `//` comments only.