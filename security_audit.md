# Security Audit Report
**Project:** AppointDent — Capstone Dental Clinic  
**Date:** 2026-06-19  
**Auditor:** Antigravity AI  
**Scope:** Security vulnerabilities · Authentication · Data privacy

---

## Executive Summary

The codebase is well-structured and uses modern, secure patterns for a Next.js + Supabase application. The foundation — server-only auth, `enforceRole`, PKCE OAuth callback, httpOnly cookies — is solid. However, there are several **medium-to-high severity issues** that need to be fixed before production.

---

## Part 1 — Security Vulnerabilities

---

### 🔴 CRITICAL — Server Actions Have No Role Guards

**Files:** `billingActions.ts`, `managementActions.ts`, `appointmentActions.ts`, `personnelActions.ts`, `bookingActions.ts`

**What's happening:**  
Every Server Action executes privileged operations using `supabaseAdmin` — the service-role key that **bypasses all RLS** — but none of them verify who is calling them. Any authenticated user (including a patient) could call `createTransaction`, `deletePersonnel`, `manageClinicHolidays`, or `addBlockedSlot` directly.

In Next.js, Server Actions are exposed as HTTP POST endpoints. The page-level `enforceRole` only protects the *render* of the page, not the *action endpoint* itself.

```ts
// billingActions.ts — no auth check at all
export async function createTransaction(data: CreateTransactionData) {
  // supabaseAdmin bypasses all RLS — any caller can run this
  const { data: appt } = await supabaseAdmin.from('appointments')...
}
```

**How to fix:**  
Add a `requireRole` helper to `src/lib/auth/protection.ts`:

```ts
export async function requireRole(...roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!data || !roles.includes(data.role)) throw new Error('Forbidden')
  return { user, role: data.role }
}
```

Then call it at the top of every sensitive action:

```ts
export async function createTransaction(data: CreateTransactionData) {
  await requireRole('staff', 'superadmin')  // ← add this
  // ...rest of function
}

export async function deletePersonnel(userId: string) {
  await requireRole('superadmin')
  // ...
}

export async function manageClinicHolidays(...) {
  await requireRole('staff', 'superadmin')
  // ...
}

export async function addBlockedSlot(...) {
  await requireRole('dentist', 'superadmin')
  // ...
}
```

---

### 🔴 CRITICAL — `server.ts` Not Guarded as Server-Only

**File:** `src/lib/supabase/server.ts`

**What's happening:**  
`server.ts` holds the `SUPABASE_SERVICE_ROLE_KEY`. It's currently safe because it's only imported by server actions — but there is no compile-time guard preventing it from being accidentally imported by a `'use client'` component, which would bundle the service key into the browser.

**How to fix:**  
Add one import at the top of `src/lib/supabase/server.ts`:

```ts
import 'server-only'  // ← causes a build error if imported client-side
```

---

### 🟠 HIGH — `registerPatient` Has No Caller Verification

**File:** `src/actions/patientActions.ts`, line 133

**What's happening:**  
`registerPatient` inserts into `patients` via `supabaseAdmin` with no check on who is calling it. A malicious patient could register records with arbitrary `user_id` values, potentially hijacking another patient's account linkage.

**How to fix:**
```ts
export async function registerPatient(data: RegisterPatientData) {
  await requireRole('staff', 'dentist', 'superadmin')
  // ...
}
```

---

### 🟠 HIGH — `addStaff` / `addDentist` / `deletePersonnel` Have No Role Guard

**File:** `src/actions/personnelActions.ts`

**What's happening:**  
These functions create real Supabase auth accounts and modify the database without verifying the caller is a superadmin. Any authenticated patient could call these actions.

**How to fix:**
```ts
export async function addStaff(data: StaffData) {
  await requireRole('superadmin')
  // ...
}
```
```ts
export async function addDentist(data: DentistData) {
  await requireRole('superadmin')
  // ...
}
```
```ts
export async function deletePersonnel(userId: string) {
  await requireRole('superadmin')
  // ...
}
```

---

### 🟡 MEDIUM — `type` URL Param is Unsanitized in Auth Callback

**File:** `src/app/auth/callback/route.ts`, line 61

**What's happening:**  
The `type` URL parameter is passed directly to `verifyOtp()` via an unsafe `as any` cast.

```ts
type: type as any,  // ← no validation
```

**How to fix:**
```ts
const VALID_OTP_TYPES = ['signup', 'recovery', 'invite', 'email', 'sms', 'phone_change', 'email_change']
if (!VALID_OTP_TYPES.includes(type)) {
  return NextResponse.redirect(new URL('/login?error=INVALID_TYPE', request.url))
}
const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as OtpType })
```

---

### 🟡 MEDIUM — Detailed Error Messages Leaked to Clients

**Files:** All server actions

**What's happening:**  
Server actions return raw `error.message` strings to the browser, potentially exposing database internals like `"duplicate key value violates unique constraint patients_user_id_key"`.

**How to fix:**  
Log details server-side; return generic messages to the client:

```ts
} catch (error) {
  console.error('[createTransaction]', error)
  return { success: false, error: 'An error occurred. Please try again.' }
}
```

---

### 🟢 LOW — No HTTP Security Headers

**File:** `next.config.js`

**How to fix:**
```js
module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ]
    }]
  },
}
```

---

## Part 2 — Authentication Audit

---

### ✅ Middleware — CORRECT

- Uses `supabase.auth.getUser()` (server-validated JWT) not `getSession()` (client-trusted).
- Redirects unauthenticated users away from all dashboard routes.
- Blocks non-superadmins from `/superadmin-dashboard`.
- `clinic_id` cookie is set with `httpOnly: true`, `secure: true` in production.

---

### ✅ `enforceRole` — CORRECT

Queries the `users` database table — not just JWT metadata — so it cannot be bypassed with a forged JWT. Applied correctly on all dashboard layouts.

---

### 🔴 ISSUE — Server Actions Are NOT Protected

As documented in Part 1: `enforceRole` only protects page renders. Server Actions are separate endpoints and **must** be independently guarded with `requireRole`.

---

### 🟡 ISSUE — Middleware Reads Role from JWT Metadata

**File:** `middleware.ts`, line 24

```ts
const userRole = user?.user_metadata?.role
```

This reads the role from the JWT `user_metadata`, which is set during sign-up. A user who manipulates their metadata during sign-up could potentially bypass middleware role checks. This is largely mitigated by `enforceRole` on every layout, but it's a secondary concern.

**Fix (optional):** Make middleware do a DB role lookup — though this adds latency on every request. The current two-layer approach (middleware fast-check + layout DB check) is acceptable if every protected route has a layout with `enforceRole`.

---

### 🟠 ISSUE — Patient Could Access Another Patient's Data via URL

**Scenario:**  
A patient navigates to `/patient-dashboard/clinicrecord`. `enforceRole('patient')` passes. But if the page resolves `patient_id` from a URL parameter instead of from the session, Patient A can view Patient B's records by changing `?patient=42` to `?patient=43`.

**Verify in:** `src/app/patient-dashboard/clinicrecord/page.tsx`

**Safe pattern:**
```ts
// Always resolve from session — never trust the URL for patient identity
const { data: patient } = await supabase
  .from('patients')
  .select('id')
  .eq('user_id', authUser.id)
  .single()
```

---

### 🟠 ISSUE — `fetchPatientBillingHistory` Accepts Any Patient ID

**File:** `src/actions/billingActions.ts`, line 128

The function takes a raw `patientId` number. If called from patient-facing code, any patient can supply another patient's ID and get their billing history.

**How to fix:**
```ts
export async function fetchPatientBillingHistory(patientId: number, clinicId?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: roleRow } = await supabase.from('users').select('role').eq('id', user.id).single()
    const isStaff = ['staff', 'dentist', 'superadmin'].includes(roleRow?.role ?? '')
    if (!isStaff) {
      const { data: patient } = await supabase
        .from('patients').select('id').eq('id', patientId).eq('user_id', user.id).maybeSingle()
      if (!patient) throw new Error('Forbidden')
    }
  }
  // ...rest
}
```

---

## Part 3 — Data Privacy

---

### Data Collected

| Category | Fields | Table |
|---|---|---|
| Identity | first_name, last_name, email, phone | `patients` |
| Demographics | birthdate, gender, address | `patients` |
| **Medical (Sensitive)** | blood_type, allergies, medications, medical_conditions, is_pregnant, is_smoker | `patient_medical_history` |
| Guardian Info | guardian_name, guardian_phone, guardian_address | `patients` |
| Clinical Records | diagnoses, prescriptions, treatment history, dental charts | Multiple |
| Insurance | hmo_cards JSON | `patients` |
| Network | ip_address | `informed_consent` |
| Behavioral | login timestamps, email, role | `login_logs` |

---

### 🔴 CRITICAL — Medical Data Stored Plain-Text (Legal Risk)

Sensitive fields — blood type, allergies, medications, is_pregnant, is_smoker — are stored as plain-text/JSON. Anyone with database access reads them in clear. Under the **Philippine Data Privacy Act (RA 10173)**, this is a compliance gap.

**Fix (long-term):** Implement field-level encryption on `patient_medical_history`:
```ts
// Before insert: encrypt sensitive fields
const encrypted = await encrypt(data.allergies, patientKey)
// Before read: decrypt
const decrypted = await decrypt(row.allergies, patientKey)
```

Use Node's `crypto.subtle` or `libsodium-wrappers`.

---

### 🟠 HIGH — IP Addresses Collected Without Explicit Disclosure (Legal Risk)

**Table:** `informed_consent.ip_address`

IP addresses are personal data under GDPR and RA 10173. Collecting them without disclosure in a Privacy Policy or consent form is a legal risk.

**Fix:** Add to the patient consent form: *"Your IP address is recorded at the time of signing for legal verification purposes."*

---

### 🟠 HIGH — Login Activity Logged Without User Disclosure

**Table:** `login_logs`

Email, role, and login timestamp are stored per login with no user-facing notice.

**Fix:** Disclose in Privacy Policy: *"We record login activity including your email address and timestamp for security monitoring."*

---

### 🟡 MEDIUM — No Data Retention Policy

There is no automated deletion or archival mechanism for old records. RA 10173 requires you to define and enforce retention limits.

**Fix:** Add Supabase `pg_cron` jobs:
```sql
-- Delete login logs older than 1 year
DELETE FROM public.login_logs WHERE login_at < NOW() - INTERVAL '1 year';

-- Delete notifications older than 6 months  
DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '6 months';
```

---

### 🟡 MEDIUM — No Privacy Policy Page

There is no `/privacy-policy` or `/terms` route in the app. RA 10173 requires a publicly accessible Privacy Notice.

**Fix:** Create `src/app/privacy-policy/page.tsx` covering: what data is collected, why, how long it is kept, who has access, and patient rights (access, correction, deletion).

---

### ✅ GOOD — No API Keys in Git

`.gitignore` correctly excludes all `.env*` files. `.env.local` and `.env` are present locally but not committed.

### ✅ GOOD — No XSS Vectors

No `dangerouslySetInnerHTML`, `eval()`, `innerHTML`, or `document.write` found.

### ✅ GOOD — No Client-Side Sensitive Storage

No `localStorage` or `sessionStorage` usage. Sessions managed by Supabase httpOnly cookies.

### ✅ GOOD — No SQL Injection Risk

All queries use Supabase's parameterized query builder. No raw SQL string concatenation.

---

## Priority Fix List

| Priority | Issue | Effort |
|---|---|---|
| 🔴 P1 | Add `requireRole()` guard to all Server Actions | 2–3 hrs |
| 🔴 P1 | Add `import 'server-only'` to `server.ts` | 5 min |
| 🔴 P1 | Medical data field-level encryption | Ongoing |
| 🟠 P2 | Verify patient pages resolve ID from session (not URL) | 1 hr |
| 🟠 P2 | Scope `fetchPatientBillingHistory` to session user | 30 min |
| 🟠 P2 | Sanitize `type` param in auth callback | 15 min |
| 🟠 P2 | Add IP collection disclosure to consent form | 30 min |
| 🟡 P3 | Add HTTP security headers to `next.config` | 15 min |
| 🟡 P3 | Create Privacy Policy page | 1–2 hrs |
| 🟡 P3 | Add data retention cron jobs | 2 hrs |
| 🟡 P3 | Use generic error messages in server actions | 1 hr |
