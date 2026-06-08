You are optimizing a Next.js 14 (App Router) + Supabase + TypeScript codebase by wrapping eligible server-side read functions with React's `cache()` to eliminate redundant Supabase round-trips within the same request.

Key facts about React cache():
  - Deduplicates calls with identical arguments within a single server render pass
  - Request-scoped: discarded after each request, never shared across users or requests
  - Server-side only: works in server components, server actions, and service/helper files imported by them
  - Safe for multi-tenant apps: each request gets its own isolated cache — no data leaks between clinics or users

---

**STEP 1 — Scan and classify every function**

Scan all files in:
  - /actions/
  - /services/
  - /lib/
  - /utils/
  - /app/**/page.tsx
  - /app/**/layout.tsx

For every async function, classify it as one of:

  READ   — only performs SELECT queries or pure computation; no inserts, updates, deletes, or side effects
  WRITE  — performs INSERT, UPDATE, DELETE, upsert, or any mutation (even if it also reads first)
  MIXED  — performs a read then uses the result to decide whether to write (treat as WRITE)
  AUTH   — calls enforceRole(), getUser(), or any Supabase Auth method
  UTIL   — pure computation, no database calls at all

Output the full classification list before proceeding.

---

**STEP 2 — Identify wrap candidates**

A function is eligible for cache() wrapping if ALL of the following are true:
  1. Classification is READ or AUTH
  2. It is async
  3. It is called from server components, layouts, server actions, or other server-side files
  4. It is NOT already wrapped in cache() or unstable_cache()
  5. It is NOT an inline anonymous function
  6. It accepts serializable arguments only (string, number, boolean, null — no Request objects, no FormData, no class instances)

A function must NOT be wrapped if ANY of the following are true:
  - Classification is WRITE, MIXED, or UTIL
  - It performs revalidatePath() or revalidateTag()
  - It has observable side effects (logging to external services, sending emails/SMS, writing files)
  - It is exported as a Next.js route handler (GET, POST, etc.)
  - It is used in a 'use client' file

List every eligible function with its file path before proceeding.

---

**STEP 3 — Apply cache() wrapping**

For each eligible function:

1. Add the import at the top of the file if not already present:
     import { cache } from 'react'

2. Wrap the function using one of these patterns — choose based on how the function is currently defined:

   Pattern A — named function declaration:
     Before: export async function getFoo(id: number) { ... }
     After:  export const getFoo = cache(async (id: number) => { ... })

   Pattern B — already a const arrow function:
     Before: export const getFoo = async (id: number) => { ... }
     After:  export const getFoo = cache(async (id: number) => { ... })

   Pattern C — function used only internally (not exported), called multiple times:
     Wrap only if it is called more than once per request path.
     Use the same pattern as A or B but without export.

3. Do NOT change:
   - The function name
   - The parameter names or types
   - The return type
   - Any logic inside the function body
   - Any callers of the function

---

**STEP 4 — Handle the enforceRole / auth pattern specifically**

The auth check (enforceRole or equivalent) is called in both the layout AND the page for every route, firing twice per navigation. This is the highest-value cache() candidate in the codebase.

If enforceRole (or getUser / getSession) is not already wrapped:
  - Wrap it in cache() in its source file
  - Verify it has no side effects beyond reading the session
  - If it redirects on failure (redirect() or NextResponse.redirect()), that is acceptable — cache() does not suppress thrown errors or redirects

---

**STEP 5 — Handle clinic_id resolution**

Any function that resolves a user's clinic_id from clinic_staff, clinic_patients, or dentists tables
is called once per page AND once in the layout on every navigation. If a shared helper does not
already exist for this, create one:

  // lib/auth/getClinicId.ts
  import { cache } from 'react'
  import { createClient } from '@/lib/supabase/serverSSR'

  export const getStaffClinicId = cache(async (userId: string): Promise => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', userId)
      .maybeSingle()
    return data?.clinic_id ?? null
  })

Then replace every inline clinic_id lookup across all page and layout files with a call to this helper.
Do not change the surrounding logic — only replace the inline query with the helper call.

---

**STEP 6 — Verify**

For each modified file:
  1. Confirm the import { cache } from 'react' is present and not duplicated
  2. Confirm no WRITE or MIXED function was wrapped
  3. Confirm no function signature or return type changed
  4. Confirm no caller was modified (callers use the function identically)
  5. Confirm TypeScript still infers the correct return type through the cache() wrapper
     (cache() preserves the generic type of the wrapped function)

---

**STEP 7 — Output**

For each modified file, show a unified diff.

Then show a summary table:

  | Function              | File                        | Reason wrapped              |
  |-----------------------|-----------------------------|-----------------------------|
  | enforceRole           | lib/auth/protection.ts      | Called in layout + every page |
  | getStaffClinicId      | lib/auth/getClinicId.ts     | Called in layout + every page |
  | getStaffDashboardData | services/dashboardService.ts| Called on every dashboard load|
  | ...                   | ...                         | ...                         |

Finally, list any functions that were considered but skipped, with the reason they were excluded.