# Execution Plan — Refactor Pass

Source: SCAN_RESULTS.md (scan pass) + planning pass. CLAUDE.md is the source of
truth; where the scan and CLAUDE.md disagree, CLAUDE.md wins.

Status: APPROVED FOR EXECUTION (dialog work deferred — see Deferred section).

---

## Ground rules

- Follow CLAUDE.md: surgical changes, match existing style, `'use server'` +
  try/catch + `{ success }` returns for actions, flat domain folders (no nested
  `hooks/`/`components/`), `createClient()` then `supabaseAdmin` for privileged writes.
- `npm run lint` must pass clean after each commit.
- No native dialogs are being introduced or removed in this pass (deferred).

---

## In scope (ordered)

### 1. `normalizeRelation` util
- Add `normalizeRelation<T>(r: T | T[] | null): T | null` to `src/lib/utils.ts`.
- Rationale: CLAUDE.md (Client Component Patterns) calls for a shared helper
  instead of repeated inline `Array.isArray` checks.

### 2. Dashboard dedup
- New `src/components/features/dashboard/types.ts` — shared `RawAppointment` and
  `Appointment` types (currently duplicated in the two pages).
- Update `src/app/staff-dashboard/page.tsx` and
  `src/app/dentist-dashboard/page.tsx` to import the shared types and use
  `normalizeRelation` instead of inline `Array.isArray(...)` mapping.

### 3. PatientRecordModal split (🔴 size only)
- Current: 655 lines → target shell ~130 lines. All flat in
  `src/components/features/patients/`.
- `usePatientRecord.ts` (~110) — state + `handleSaveMedicalHistory`,
  `handleRefreshRecord`, `handleAddAssessmentSubmit`.
- `MedicalHistoryTab.tsx` (~280) — the `activeRecordTab === 'info'` block
  (current lines 222–576).
- `PatientRecordModal.tsx` (~130) — portal shell + tab switch + header/footer.
- NOTE: leave the 4 `alert()` calls (105, 149, 164, 172) in place this pass.

### 4. Portal-ize modals
- Wrap in `createPortal` gated behind a `mounted` flag (CLAUDE.md modal convention):
  BookAppointmentModal, RescheduleModal, AppointmentBillingModal,
  CreateInvoiceModal, PatientRecordModal.

### 5. LoginForm split
- `SignUpForm.tsx` (~230) — sign-up branch (current lines 324–497) + `validate()`,
  `handleChange`, `handleSignUp`.
- Keep sign-in / forgot-password Auth UI in `LoginForm.tsx`.
- Delete decorative `/* ----- */` divider comments (CLAUDE.md comments rule).

### 6. patientCoreActions cleanup
- Flatten `resolveUpdaterInfo` (lines 20–63) 3-level nesting into guard clauses.
- Remove the two `as any` casts (lines 36, 46) by typing the `clinics` join as
  `{ name: string } | { name: string }[] | null` + `normalizeRelation`.
- Reconcile `PatientSummary` name collision: declared in BOTH
  `patientCoreActions.ts` and `components/features/patients/types.ts`.

---

## Deferred (needs a decision: toast lib vs shared ConfirmDialog)

CLAUDE.md line 125 bans `alert()`/`confirm()` but leaves the replacement as a TODO.
Do not touch these until the mechanism is chosen:
- `AppointmentsClient.tsx` — 3× `confirm()` (53, 69, 87), 2× `alert()` (82, 92),
  plus add disable-during-submit on the action buttons.
- `PatientRecordModal.tsx` — 4× `alert()` (105, 149, 164, 172).
- `DataTable.tsx` — `confirm()` (line 80).

---

## Dismissed (NOT violations)

- 8× "types exported from action files" — CLAUDE.md line 102 mandates co-locating
  input interfaces in the action file. No `src/types/` convention exists.
- LoginForm `alert()` / `as any` — scan hallucinated; file has neither.
- `<form>` tags — CLAUDE.md does not ban forms.
- `patient-dashboard/layout.tsx` inline `'use server'` `logoutAction` — valid
  Next.js pattern; cosmetic only.

---

## Commit grouping

a. `refactor: add normalizeRelation + dedupe dashboard appointment types` (items 1–2)
b. `refactor: extract usePatientRecord hook + MedicalHistoryTab` (item 3)
c. `refactor: render modals via createPortal` (item 4)
d. `refactor: extract SignUpForm from LoginForm` (item 5)
e. `refactor: flatten resolveUpdaterInfo + drop as-any casts` (item 6)
