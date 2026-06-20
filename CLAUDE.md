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

# Project-Specific Guidance

Dental clinic management app. Stack: Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind v4, Framer Motion. Four role dashboards: `patient`, `dentist`, `staff`, `superadmin`.

## 5. Tech Stack & Supabase Clients

**Pick the right Supabase client for the context — there are three, and they are not interchangeable.**

- `@/lib/supabase/client` (`supabase`): browser/`'use client'` only, anon key, respects RLS.
- `@/lib/supabase/serverSSR` (`createClient()`): server components/route handlers, reads the user session from cookies. Use for `supabase.auth.getUser()`. Async — `await createClient()`.
- `@/lib/supabase/server` (`supabaseAdmin`): service-role key, **bypasses RLS**. Server actions / `'use server'` only. Never import into a client component (leaks the secret key).

Why: RLS is the security boundary. Using `supabaseAdmin` to dodge an RLS failure silently removes that boundary. Confirm the user/role with `createClient()` first, then use `supabaseAdmin` for the privileged write.

```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data } = await supabaseAdmin.from('patients').select('...').eq('user_id', user.id)
```

## 6. Server Actions: Contract & Return Shape

**Every mutating server action lives in `src/actions/*Actions.ts`, starts with `'use server'`, and returns `{ success: boolean, ... }` — never throws to the client.** Wrap the body in try/catch, log `console.error('Error in <fn>:', error)`, return `{ success: false, error: error instanceof Error ? error.message : 'Fallback' }`.

Why: The UI branches on `res.success` (see `PrescriptionsTab.handleSave`). A thrown action breaks that contract and the form's loading/error handling.

```ts
export async function addThing(data: ThingData) {
  try {
    const { data: row, error } = await supabaseAdmin.from('things').insert([{...}]).select().single()
    if (error) throw new Error(error.message)
    revalidatePath('/staff-dashboard/patients')
    revalidatePath('/dentist-dashboard/patients')
    return { success: true, thing: row }
  } catch (error) {
    console.error('Error in addThing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add thing' }
  }
}
```

Co-locate the action's input `interface` (e.g. `PrescriptionData`, `RegisterPatientData`) in the same file and `export` it; clients import it from there.

## 7. Code Organization

**Two component homes — keep them straight.** Route-private UI → `src/app/<dashboard>/_components/` (underscore = not a route). Cross-dashboard reusable feature UI → `src/components/features/<domain>/`. Design-system primitives (`Button`, `Card`, `Badge`) → `src/components/ui/`, using CVA + `cn()` from `@/lib/utils`.

Why: `PatientsClient`, `FollowupsTab` etc. are shared by both dentist and staff patient pages, so they belong in `features/patients/`. Burying shared UI under one dashboard's `_components` forces cross-route imports.

Conventions: components `PascalCase.tsx` (default export); actions `camelCaseActions.ts`; read-only fetchers in `src/services/*Service.ts`; query builders in `src/lib/queries/`. Import alias `@/` → `src/`.

## 8. Page Pattern: Server Page → Client Island

**Dashboard pages are async Server Components that (1) authorize, (2) resolve the role's clinic/profile, (3) fetch initial data, (4) hand it to a `*Client` component as props.** Guard with `enforceRole('<role>')` from `@/lib/auth/protection`; never assume the session.

Why: Keeps secrets and data fetching on the server while interactivity stays in a focused client island. Mirrors `app/dentist-dashboard/patients/page.tsx`.

```tsx
export default async function PatientsPage() {
  const authUser = await enforceRole('dentist')
  const { data: dentistRecord } = await getDentistRecordByUserId(authUser.id)
  if (!dentistRecord?.clinic_id) return <div className="p-8 text-center text-gray-400">No clinic assigned…</div>
  const patientsRes = await fetchPatientsByClinic(dentistRecord.clinic_id, '', true)
  return <PatientsClient clinicId={dentistRecord.clinic_id} initialPatients={patientsRes.patients || []} dentistId={dentistRecord.id} viewerRole="dentist" />
}
```

## 9. Client Component Patterns (forms, loading, refresh)

**Follow the established tab pattern for any data-entry form:** local `useState` per field + an `isSubmitting` flag; disable submit while submitting; on `res.success` reset fields and call parent-provided `onRefresh()`; on failure surface `res.error`. Pass `viewerRole`, `clinicId`, `dentistId`/`patientId` down as props rather than re-deriving client-side.

Why: Consistent with `PrescriptionsTab`/`FollowupsTab`/`TreatmentTab`. Refresh is owned by the parent via `onRefresh: () => Promise<void>`, so children don't re-fetch independently and lists stay in sync.

Notes: a Supabase joined relation may type as `T | T[] | null` (e.g. `dentists`) — normalize before rendering. Modals use `createPortal` gated behind a `mounted` flag to stay SSR-safe. Inline `alert()` exists for quick validation, but prefer surfacing `res.error` in the UI for new work.

## 10. Verification

**No test suite exists — verify manually against the dev server and lint.** Run `npm run lint` (must pass clean) and `npm run dev`, then exercise the exact role/dashboard you changed (log in as a dentist → Patients → the affected tab → submit → confirm the list refreshes). Bash is sandboxed here; run commands via the PowerShell tool.

Why: UI/data-flow regressions only surface by walking the real role flow. State success as a concrete click-path ("submit prescription → row appears after `onRefresh`"), not "make it work". Confirm `revalidatePath` covers every dashboard that renders the mutated data.