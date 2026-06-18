# AppointDent Architecture Pivot & Implementation Plan

Based on the recent context and architecture pivot to a single business with multiple branches, this plan outlines the necessary steps to transition the application.

## 📋 Phase 1: Database & RLS Restructuring
- [ ] Update RLS policies to allow staff and dentists to read clinical records company-wide (drop `auth_clinic_id()` read restrictions). Keep `clinic_id` on rows for audit.
  - Tables: `dental_charts`, `tooth_conditions`, `patient_medical_history`, `clinical_assessments`, `tmj_assessments`, `periodontal_screenings`, `oral_surgery_records`, `prescriptions`, `treatment_history`, `informed_consent`, `follow_up_schedules`.
- [ ] Update RLS policies for transaction tables to allow company-wide reads for staff.
  - Tables: `transactions`, `transaction_items`.
- [ ] Split `appointments` RLS policies:
  - **WRITE**: Remains clinic-scoped (booking at a physical location).
  - **READ**: Company-wide for staff to maintain treatment continuity context.

## 📋 Phase 2: Refactoring Auth & Login Flow
- [ ] **Patient Login Updates**:
  - Remove the `?clinic=` query parameter dependency from `/login`.
  - Update the landing page to point the login button straight to `/login` without any clinic params.
- [ ] **Auth Callback & Cookies**:
  - Remove setting the `clinic_id` httpOnly cookie in `/auth/callback/route.ts` for patients.
- [ ] **Dashboard Access Checks**:
  - Remove `verifyClinicAccess()` check and redirect logic in `src/app/patient-dashboard/page.tsx`.

## 📋 Phase 3: Patient Dashboard Revamp (Unified View)
- [ ] Refactor `src/app/patient-dashboard/page.tsx` to display a unified view of the patient's records across all branches.
- [ ] Consolidate views for:
  - All appointments
  - All medical history
  - All prescriptions
- [ ] Remove any clinic-specific lock or headers in the patient's dashboard.

## 📋 Phase 4: Appointment Scheduling Updates
- [ ] Update the "Schedule Appointment" flow to include branch selection.
- [ ] Ensure the patient can pick which physical branch to visit only during the booking process.

## 📋 Phase 5: Audit Logging System
- [ ] Create `login_logs` table (`user_id`, `email`, `role`, `login_at`).
- [ ] Implement a shared server action to insert login records.
- [ ] Integrate logging in `/auth/callback` for Google OAuth.
- [ ] Integrate logging in a client-side `onAuthStateChange` listener for email/password logins (since `@supabase/auth-ui-react` handles them internally).
- [ ] Finalize logging logic in `src/app/superadmin-login/page.tsx` to capture superadmin logins.

## 📋 Phase 6: Unsolved Problems Resolution
- [ ] Review and address any outstanding known unsolved problems mentioned previously during the pivot.
