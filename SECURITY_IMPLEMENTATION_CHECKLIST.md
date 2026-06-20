# Security Audit Implementation Checklist

**Project:** AppointDent — Capstone Dental Clinic  
**Date Created:** 2026-06-20  
**Total Estimated Effort:** 39 hours  
**Status:** Not Started

---

## PHASE 1: CRITICAL FOUNDATION (50 minutes)
*Must complete before other work*

### 1.1 Add 'server-only' guard to server.ts
- [x] Open `src/lib/supabase/server.ts`
- [x] Add `'server only'` as first line in file
- [x] Verify build passes without client-side errors
- [ ] **Effort:** 5 minutes

### 1.2 Create authorization utility module
- [x] Create new file `src/lib/auth/ensureRole.ts`
- [x] Implement `ensureRole(...roles: string[])` function that:
  - [x] Gets current user via `createClient()`
  - [x] Queries `users` table for user role
  - [x] Throws/returns error if role not in allowed list
  - [x] Caches result using React's `cache()`
- [x] Export function with TypeScript types
- [x] Add JSDoc comments
- [ ] **Effort:** 45 minutes

---

## PHASE 2: SERVER ACTION ROLE GUARDS (9 hours)
*Protect all public-facing mutations — Critical Path*

### 2.1 Billing Actions (`src/actions/billingActions.ts`)
- [x] Import `ensureRole` at top
- [x] Add guard to `createTransaction()` → staff/dentist only
- [x] Add guard to `processPayment()` → staff/dentist only
- [x] Scope `fetchPatientBillingHistory(patientId)`:
  - [x] If patient role: only allow accessing own data
  - [x] If staff/dentist: validate patient belongs to their clinic
  - [x] If superadmin: allow all
- [x] Add guard to `fetchClinicTransactions()` → staff/dentist only
- [] Test: Verify patient cannot call these endpoints
- [ ] **Effort:** 1 hour

### 2.2 Management Actions (`src/actions/managementActions.ts`)
- [x] Import `ensureRole` at top
- [x] Add guards to all functions:
  - [x] `manageClinicHolidays()` → staff only
  - [x] `fetchCalendarData()` → staff/dentist only
  - [x] `updateInventoryStock()` → staff only
  - [x] `fetchStockAlerts()` → staff only
  - [x] `fetchInventory()` → staff only
  - [x] `addInventoryItem()` → staff only
  - [x] `deleteInventoryItem()` → staff only
  - [x] `fetchInventoryLogs()` → staff only
  - [x] `retriggerNotification()` → superadmin only
  - [x] `fetchNotifications()` → staff only
  - [x] `generateSalesReport()` → superadmin only
  - [x] `generateAppointmentSummary()` → superadmin only
  - [x] `generateServiceFrequency()` → superadmin only
- [] Test: Verify unauthorized roles are blocked
- [ ] **Effort:** 2 hours

### 2.3 Appointment Actions (`src/actions/appointmentActions.ts`)
- [x] Import `ensureRole` at top
- [x] Add guards to functions:
  - [x] `fetchAppointmentsByDate()` → staff/dentist/superadmin only
  - [x] `getAvailableSlots()` → no guard (public), validate in createAppointment
  - [x] `createAppointment()` → patient can only create for self, staff unrestricted
  - [x] `updateAppointmentStatus()` → staff/dentist/patient (patient own only); performedBy/role derived server-side
  - [x] `updateMaxAppointments()` → superadmin only
  - [x] `addBlockedSlot()` → dentist only (own slots)
  - [x] `deleteBlockedSlot()` → dentist only (own slots)
  - [x] `fetchBlockedSlots()` → dentist only (own slots)
  - [x] `updateDentistWorkingHours()` → dentist only (own hours)
  - [x] `updateDentistProfile()` → dentist only (own profile)
- [x] Test: Verify patient cannot modify appointment status
- [ ] **Effort:** 2.5 hours

### 2.4 Personnel Actions (`src/actions/personnelActions.ts`)
- [x] Import `ensureRole` at top
- [x] Add guards to all functions:
  - [x] `addStaff()` → superadmin only
  - [x] `addDentist()` → superadmin only
  - [x] `deletePersonnel()` → superadmin only
  - [x] `fetchPersonnel()` → superadmin only
  - [x] `fetchStaff()` → superadmin only
  - [x] `fetchDentists()` → superadmin only
  - [x] `updatePersonnel()` → superadmin only
- [x] Test: Verify non-superadmins cannot call these
- [ ] **Effort:** 1.5 hours

### 2.5 Booking Actions (`src/actions/bookingActions.ts`)
- [x] Import `ensureRole` at top — skipped; no guards needed in this file
- [x] Review `getBranchData()` — no guard needed (public lookup, unauthenticated patients call this)
- [ ] **Effort:** 15 minutes

### 2.6 Patient Actions (`src/actions/patientActions.ts`)
- [x] Import `ensureRole` at top
- [x] Add guards with role-specific logic:
  - [x] `registerPatient()` → staff/dentist only (walk-ins)
  - [x] `fetchPatientRecord(patientId)` → patient (own), staff/dentist (any), superadmin (all)
  - [x] `fetchPatientsByClinic()` → staff/dentist only
  - [x] `addClinicalAssessment()` → dentist only
  - [x] `updateDentalChart()` → dentist only
  - [x] `updatePatientProfile(patientId)` → patient (own), staff (any)
  - [x] `updatePatientMedicalHistory()` → patient (own), staff (any)
  - [x] `addTreatmentRecord()` → dentist only
  - [x] `addPrescription()` → dentist only
  - [x] `addPeriodontalScreening()` → dentist only
  - [x] `addTmjAssessment()` → dentist only
  - [x] `submitFeedback()` → patient only (own feedback)
- [ ] Test: Verify patient cannot modify other patient's records
- [ ] **Effort:** 2 hours

---

## PHASE 3: MEDICAL DATA ENCRYPTION (8 hours)
*Can run in parallel with other phases*

### 3.1 Create encryption utility module
- [x] Create new file `src/lib/encryption/medicalEncryption.ts`
- [x] Implement encryption functions:
  - [x] `encryptMedicalData(plaintext: string): Promise<string>`
  - [x] `decryptMedicalData(ciphertext: string): Promise<string>`
- [x] Use AES-256-GCM symmetric encryption
- [x] Use ENCRYPTION_KEY env var for key derivation
- [x] Handle IV/salt consistently — random 12-byte IV per call; format: `iv.authTag.ciphertext` (all base64)
- [x] Add error handling for encryption failures — throws on bad key, bad format, auth tag mismatch
- [ ] **Effort:** 2 hours

### 3.2 Identify sensitive fields to encrypt
- [x] `patient_medical_history`: blood_type, allergies, current_medications, medical_conditions, previous_surgeries, medical_flags, blood_pressure
- [x] `prescriptions`: medication, dosage, frequency, duration, notes
- [x] `periodontal_screenings`: findings
- [x] `clinical_assessments`: diagnosis, treatment_plan, notes
- [x] `treatment_history`: treatment, notes
- [ ] **Effort:** 30 minutes

### 3.3 Create database migration for encryption
- [x] Migration applied: `encrypt_medical_array_columns_to_text`
  - Changed `allergies`, `current_medications`, `medical_conditions` from `text[]` → `text`
  - Existing array data preserved as JSON strings via `array_to_json()::text`
- [x] Backward compatibility: `decryptMedicalData()` passes through values without `enc:` prefix
- [x] Array fields: JSON.stringify on write, JSON.parse after decrypt on read
- [ ] **Effort:** 1.5 hours

### 3.4 Update patient actions to encrypt/decrypt
- [x] Modify `src/actions/patientActions.ts`:
  - [x] Encrypt medical fields on write (`registerPatient`, `updatePatientMedicalHistory`, `addClinicalAssessment`, `addTreatmentRecord`, `addPrescription`, `addPeriodontalScreening`)
  - [x] Decrypt medical fields on read (`fetchPatientRecord`)
- [x] `src/actions/appointmentActions.ts` — prescriptions written via `addPrescription` in patientActions; no separate change needed
- [ ] Test roundtrip: encrypt → decrypt → verify data integrity
- [ ] **Effort:** 2 hours

### 3.5 Environment setup
- [x] Add `ENCRYPTION_KEY` to `.env.local` (32-byte base64, generated via `crypto.randomBytes(32)`)
- [x] Key generation: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [x] Verify key is NOT committed to git — `.env.local` is in `.gitignore`
- [ ] **Effort:** 30 minutes

---

## PHASE 4: PATIENT DATA ACCESS CONTROL (6 hours)
*Depends on Phase 2 completion*

### 4.1 Create patient access validation utility
- [x] Create new file `src/lib/auth/validatePatientAccess.ts`
- [x] Implement `validatePatientAccess()` function that:
  - [x] If patient role: check user_id matches patients.user_id
  - [x] If staff/dentist: derive their clinic from DB, verify patient has an appointment there
  - [x] If superadmin: always allow
  - [x] Returns `PatientAccessResult` with `allowed`, `reason`, `callerClinicId`
- [x] Add caching via React `cache()` to avoid N+1 queries
- [ ] **Effort:** 1.5 hours

### 4.2 Apply to patient data actions
- [x] `fetchPatientRecord()` — replaced inline check with `validatePatientAccess()`
- [x] `fetchPatientBillingHistory()` — replaced broken `patients.clinic_id` check with `validatePatientAccess()`
- [x] `updatePatientProfile()` — replaced inline check with `validatePatientAccess()`
- [x] `updatePatientMedicalHistory()` — replaced inline check with `validatePatientAccess()`
- [x] `submitFeedback()` — added appointment ownership check (`appointments.patient_id = patientId`)
- [ ] Test: Attempt cross-patient access, verify rejection
- [ ] **Effort:** 2 hours

### 4.3 Sanitize auth callback URL parameters
- [x] Open `src/app/auth/callback/route.ts`
- [x] Add Zod schema for auth parameters:
  - [x] `type` must be one of: ['recovery', 'email_change', 'email', 'signup', 'magiclink']
  - [x] `clinic` must be numeric string (validated via regex `^\d+$`)
  - [x] `next` must be a relative path (validated via regex `^\/`)
- [x] Validate all parameters before use — redirect to `/login?error=INVALID_PARAMS` on failure
- [x] Removed duplicate `searchParams.get('clinic')` reads — now uses validated `attemptedClinicId`
- [ ] Test: Attempt invalid type values, verify rejection
- [ ] **Effort:** 1.5 hours

### 4.4 Test access control
- [x] Test patient accessing own vs. other patient's data — `fetchPatientRecord` blocks cross-patient access
- [x] Test staff accessing patients outside their clinic — `fetchPatientBillingHistory` access denied path
- [x] Test unauthenticated caller blocked — all actions return `Not authenticated`
- [x] All 31 tests passing (`npx vitest run`)
- [ ] **Effort:** 1 hour

---

## PHASE 5: ERROR MESSAGE SANITIZATION (2 hours)
*Can run in parallel*

### 5.1 Create error handling utility
- [x] Create new file `src/lib/errors/sanitizeError.ts`
- [x] Implement `sanitizeServerError()` function:
  - [x] In development: return full error message
  - [x] In production: return generic "An unexpected error occurred"
  - [x] Whitelist safe messages (permissions, reschedule limits, access denied, feedback duplicate, etc.)
- [ ] **Effort:** 45 minutes

### 5.2 Apply to all server actions
- [x] Replaced 64 occurrences across 9 action files via bulk regex replace
- [x] Import added to all 9 files: `appointmentActions`, `billingActions`, `bookingActions`, `clinicActions`, `clinicSetupActions`, `managementActions`, `patientActions`, `personnelActions`, `serviceActions`
- [x] console.error() retained in every catch block — full details still log server-side
- [ ] Test: Verify stack traces don't reach client in production build
- [ ] **Effort:** 1.25 hours

---

## PHASE 6: HTTP SECURITY HEADERS (2 hours)
*Can run in parallel*

### 6.1 Add security headers to middleware
- [x] Open `middleware.ts`
- [x] Add headers to response:
  - [x] `X-Content-Type-Options: nosniff`
  - [x] `X-Frame-Options: DENY`
  - [x] `X-XSS-Protection: 1; mode=block`
  - [x] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - [x] `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co`
  - [x] `Referrer-Policy: strict-origin-when-cross-origin`
  - [x] `Permissions-Policy: geolocation=()`
- [ ] Test: Verify headers present in network tab
- [ ] **Effort:** 1 hour

### 6.2 Alternative: Add to next.config
- [x] Middleware approach worked — next.config not needed

---

## PHASE 7: LEGAL COMPLIANCE & LOGGING DISCLOSURE (4 hours)
*Can run in parallel*

### 7.1 Implement audit logging with disclosure
- [ ] Open `src/lib/audit/logLogin.ts` (or similar)
- [ ] Modify to log only: `{ user_id, email, role, timestamp }`
- [ ] Remove IP address and user agent from database logs
- [ ] Document data retention in code comments
- [ ] **Effort:** 1 hour

### 7.2 Implement data retention policy
- [ ] Create new file `src/lib/jobs/dataRetention.ts`
- [ ] Document retention schedule:
  - [ ] Login logs: delete after 90 days
  - [ ] Audit logs: delete after 1 year
  - [ ] Soft-deleted records: delete after 2 years
- [ ] Use Supabase `pg_cron` extension or Edge Function
- [ ] Test: Verify cron job doesn't error on empty tables
- [ ] **Effort:** 1.5 hours

### 7.3 Create Privacy Policy page
- [ ] Create new file `src/app/privacy-policy/page.tsx`
- [ ] Include sections:
  - [ ] Data collection (what, why, how long)
  - [ ] Sensitive data: blood type, allergies, medications, is_pregnant, is_smoker
  - [ ] User rights: access, correction, deletion
  - [ ] Third parties: Supabase, integrations
  - [ ] Cookies: httpOnly session cookies
  - [ ] IP logging disclosure
  - [ ] Login activity disclosure
  - [ ] Contact: privacy@clinic.com
- [ ] Make readable and legally compliant for Philippines (RA 10173)
- [ ] **Effort:** 1 hour

### 7.4 Create Terms of Service page
- [ ] Create new file `src/app/terms/page.tsx`
- [ ] Include sections:
  - [ ] User responsibilities
  - [ ] Medical disclaimer
  - [ ] Limitation of liability
  - [ ] Data security commitment
  - [ ] Clinic access policies
- [ ] **Effort:** 30 minutes

### 7.5 Add footer links
- [ ] Add Privacy Policy link to app footer
- [ ] Add Terms link to app footer
- [ ] Make accessible from public pages
- [ ] **Effort:** 15 minutes

---

## PHASE 8: TESTING & VERIFICATION (4 hours)
*After all above phases complete*

### 8.1 Create authorization test suite
- [x] Create new file `src/__tests__/actions.auth.test.ts`
- [ ] Test cases:
  - [ ] billingActions.createTransaction() blocks patient
  - [ ] billingActions.fetchPatientBillingHistory() blocks unauthorized clinic staff
  - [ ] appointmentActions.updateAppointmentStatus() blocks patient on non-owned appointment
  - [ ] personnelActions.addStaff() blocks staff/dentist/patient
  - [ ] patientActions.registerPatient() blocks patient from registering others
  - [ ] encryptMedicalData() roundtrip preserves data
  - [ ] auth callback rejects invalid type parameter
- [ ] Run tests and verify all pass
- [ ] **Effort:** 1.5 hours

### 8.2 Manual security checklist
- [ ] All server actions have role guards at entry point
- [ ] Medical data encrypted on write, decrypted on read
- [ ] Patient access validated against ownership/clinic
- [ ] URL parameters sanitized in auth callback
- [ ] Error messages don't leak stack traces to client
- [ ] Security headers present in all responses (check DevTools)
- [ ] Privacy Policy visible and accurate
- [ ] Login logs don't store IP or user agent
- [ ] `'server only'` guard prevents client import of server.ts
- [ ] Environment variables set (ENCRYPTION_KEY)
- [ ] Lint passes: `npm run lint`
- [ ] **Effort:** 1.5 hours

### 8.3 Manual functional testing
- [ ] Log in as each role (patient, dentist, staff, superadmin)
- [ ] Verify role dashboards accessible
- [ ] Test data-entry flows (appointments, prescriptions, treatment)
- [ ] Verify error messages are generic (no stack traces)
- [ ] Verify medical data is encrypted in database
- [ ] Test cross-patient access attempt (should fail)
- [ ] Verify Privacy Policy page loads
- [ ] **Effort:** 1 hour

---

## DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] Set `ENCRYPTION_KEY` env var in production (32-char base64)
- [ ] Set `NODE_ENV=production` in production
- [ ] Run database migration for medical data encryption on staging first
- [ ] Verify migration completes without errors
- [ ] Backup production database before deployment

### Deployment strategy
- [ ] Deploy middleware changes (security headers) first
- [ ] Deploy new utilities (ensureRole, validatePatientAccess, etc.)
- [ ] Deploy action changes with role guards
- [ ] Deploy encryption changes
- [ ] Verify no auth errors in logs immediately post-deploy
- [ ] Monitor error rate for 1 hour

### Post-deployment
- [ ] Check error logs for any role guard failures
- [ ] Test each role dashboard works as expected
- [ ] Verify security headers in DevTools
- [ ] Spot-check encrypted fields in database (should be garbled)
- [ ] Wait 24 hours, review logs for unexpected errors

### Rollback plan
- [ ] If critical errors: revert commit
- [ ] Restore from pre-deployment database backup if data corrupted
- [ ] Notify users if data was affected

---

## PROGRESS TRACKING

| Phase | Status | Hours Spent | Notes |
|-------|--------|------------|-------|
| 1.1 | ⬜ Not Started | 0 / 0.08 | |
| 1.2 | ⬜ Not Started | 0 / 0.75 | |
| 2.1 | ⬜ Not Started | 0 / 1 | |
| 2.2 | ⬜ Not Started | 0 / 2 | |
| 2.3 | ✅ Complete | 2.5 / 2.5 | patients allowed on updateAppointmentStatus with own-record validation |
| 2.4 | ✅ Complete | 1.5 / 1.5 | all functions guarded superadmin-only |
| 2.5 | ✅ Complete | 0 / 0.25 | getBranchData is public — no guard needed |
| 2.6 | ✅ Complete | 2 / 2 | patient ownership verified via patients.user_id lookup |
| 3.1 | ✅ Complete | 2 / 2 | AES-256-GCM; format: iv.authTag.ciphertext (base64) |
| 3.2 | ✅ Complete | 0.5 / 0.5 | Fields identified across 5 tables |
| 3.3 | ✅ Complete | 1.5 / 1.5 | Array columns converted to text; backward-compat via enc: prefix |
| 3.4 | ✅ Complete | 2 / 2 | Encrypt on write, decrypt on read in patientActions |
| 3.5 | ✅ Complete | 0.5 / 0.5 | ENCRYPTION_KEY added to .env.local |
| 4.1 | ✅ Complete | 1.5 / 1.5 | validatePatientAccess(); clinic check via appointments table |
| 4.2 | ✅ Complete | 2 / 2 | Applied to 5 actions; fixed broken clinic_id bug in billingActions |
| 4.3 | ✅ Complete | 1.5 / 1.5 | Zod schema on all callback params; relative-path-only next param |
| 4.4 | ✅ Complete | 1 / 1 | 31 tests passing; cross-patient blocking verified |
| 5.1 | ✅ Complete | 0.75 / 0.75 | sanitizeServerError() with prod/dev split and safe message whitelist |
| 5.2 | ✅ Complete | 1.25 / 1.25 | 64 catch blocks replaced across 9 files |
| 6 | ✅ Complete | 1 / 2 | addSecurityHeaders() in middleware; applied to all return paths |
| 7 | ⬜ Not Started | 0 / 4 | |
| 8 | ⬜ Not Started | 0 / 4 | |
| **TOTAL** | | **0 / 39** | |

---

## NOTES

- **Critical Path:** Phase 1 → Phase 2 (must complete before Phase 4)
- **Parallel Work:** Phases 3, 5, 6, 7 can run simultaneously
- **Wall-Clock Time:** ~3 days if phases run in parallel
- **Key Decision:** Application-level encryption keeps keys in app, never sent to DB
- **Defense in Depth:** Middleware + action-level auth checks catch both render and API access
