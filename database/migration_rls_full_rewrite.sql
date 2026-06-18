-- =============================================================
-- Migration: Full RLS Policy Rewrite (based on supabase-types.ts)
-- AppointDent — Single Business, Multiple Branches Model
-- Run this in the Supabase SQL Editor.
-- =============================================================
-- Role legend (from users.role enum):
--   superadmin — business owner, full access to everything
--   staff      — branch day-to-day ops (appointments, billing, patients)
--   dentist    — clinical records & charts
--   patient    — own data only
-- =============================================================

-- Helper: convenience function to read the caller's role once per statement.
-- Already exists in the DB (auth_role), kept here as reference.
-- (SELECT role FROM public.users WHERE id = auth.uid()) is equivalent.


-- ─────────────────────────────────────────────────────────────────
-- 1. users
--    Public table that mirrors auth.users + role column.
--    No patient data here — no sensitive columns.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- Anyone authenticated can read the users table (needed for role checks in other policies)
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Insert is handled by auth callback (service role) — no client inserts
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

-- Own profile or superadmin
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );

-- Only superadmin can delete users
CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 2. clinics
--    Branch/location data. Publicly readable for the landing page.
--    Only superadmin can write.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_select" ON public.clinics;
DROP POLICY IF EXISTS "clinics_insert" ON public.clinics;
DROP POLICY IF EXISTS "clinics_update" ON public.clinics;
DROP POLICY IF EXISTS "clinics_delete" ON public.clinics;

-- Publicly readable (needed for landing page map, anon visitors)
CREATE POLICY "clinics_select" ON public.clinics
  FOR SELECT USING (true);

CREATE POLICY "clinics_insert" ON public.clinics
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "clinics_update" ON public.clinics
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "clinics_delete" ON public.clinics
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 3. clinic_staff
--    Staff belong to one branch. Superadmin manages them.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_staff_select" ON public.clinic_staff;
DROP POLICY IF EXISTS "clinic_staff_insert" ON public.clinic_staff;
DROP POLICY IF EXISTS "clinic_staff_update" ON public.clinic_staff;
DROP POLICY IF EXISTS "clinic_staff_delete" ON public.clinic_staff;

-- Staff can read their own record; superadmin reads all
CREATE POLICY "clinic_staff_select" ON public.clinic_staff
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );

CREATE POLICY "clinic_staff_insert" ON public.clinic_staff
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "clinic_staff_update" ON public.clinic_staff
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "clinic_staff_delete" ON public.clinic_staff
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 4. dentists
--    Dentists belong to one branch. Superadmin manages them.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dentists_select" ON public.dentists;
DROP POLICY IF EXISTS "dentists_insert" ON public.dentists;
DROP POLICY IF EXISTS "dentists_update" ON public.dentists;
DROP POLICY IF EXISTS "dentists_delete" ON public.dentists;

-- All authenticated users can see dentist list (needed for booking dropdowns)
CREATE POLICY "dentists_select" ON public.dentists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dentists_insert" ON public.dentists
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');

CREATE POLICY "dentists_update" ON public.dentists
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );

CREATE POLICY "dentists_delete" ON public.dentists
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 5. patients
--    Central directory (no clinic_patients junction — dropped).
--    Patients own their record; staff/dentist/superadmin read all.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_select" ON public.patients;
DROP POLICY IF EXISTS "patients_select_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_read_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_insert" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_update" ON public.patients;
DROP POLICY IF EXISTS "patients_update_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_delete" ON public.patients;
DROP POLICY IF EXISTS "patients_all_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_policy" ON public.patients;
DROP POLICY IF EXISTS "patients_read" ON public.patients;
DROP POLICY IF EXISTS "patients_write" ON public.patients;
DROP POLICY IF EXISTS "staff_dentist_read_patients" ON public.patients;

CREATE POLICY "patients_select" ON public.patients
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR user_id = auth.uid()
  );

-- Staff/dentist/superadmin register patients; patients register themselves
CREATE POLICY "patients_insert" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR user_id = auth.uid()
  );

CREATE POLICY "patients_update" ON public.patients
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR user_id = auth.uid()
  );

-- Only superadmin can hard-delete patients
CREATE POLICY "patients_delete" ON public.patients
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 6. appointments
--    READ:  company-wide for staff/dentist/superadmin + own for patients
--    WRITE: staff/dentist/superadmin (clinic-scoped via app logic)
--    UPDATE: staff (own clinic) | dentist (own clinic) | superadmin | patient (own)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_all_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_read_staff_dentist" ON public.appointments;
DROP POLICY IF EXISTS "appointments_write_clinic_scoped" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_clinic_scoped" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

-- Company-wide read for staff/dentist/superadmin; patients see own
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
    )
  );

-- Booking: staff, dentist, superadmin, or the patient themselves
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
    )
  );

-- Update: staff (own clinic), dentist (own clinic), superadmin, or patient (own)
CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'staff'
      AND clinic_id = (SELECT clinic_id FROM public.clinic_staff WHERE user_id = auth.uid() LIMIT 1)
    )
    OR (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'dentist'
      AND clinic_id = (SELECT clinic_id FROM public.dentists WHERE user_id = auth.uid() LIMIT 1)
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = appointments.patient_id AND p.user_id = auth.uid()
    )
  );

-- Only superadmin can hard-delete
CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 7. appointment_logs   (audit, append-only)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.appointment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointment_logs_select" ON public.appointment_logs;
DROP POLICY IF EXISTS "appointment_logs_insert" ON public.appointment_logs;

CREATE POLICY "appointment_logs_select" ON public.appointment_logs
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

-- Insert only; no updates or deletes (append-only audit)
CREATE POLICY "appointment_logs_insert" ON public.appointment_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 8. services   (branch-specific, public for booking)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select" ON public.services;
DROP POLICY IF EXISTS "services_insert" ON public.services;
DROP POLICY IF EXISTS "services_update" ON public.services;
DROP POLICY IF EXISTS "services_delete" ON public.services;

-- Publicly readable for booking discovery
CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_insert" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "services_update" ON public.services
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "services_delete" ON public.services
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 9. products   (branch-specific, for billing only)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "products_delete" ON public.products
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 10. transactions  (company-wide read for staff/dentist)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_transactions" ON public.transactions;
DROP POLICY IF EXISTS "select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = transactions.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 11. transaction_items
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "select_transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_select" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_update" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_delete" ON public.transaction_items;

CREATE POLICY "transaction_items_select" ON public.transaction_items
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "transaction_items_insert" ON public.transaction_items
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "transaction_items_update" ON public.transaction_items
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "transaction_items_delete" ON public.transaction_items
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 12. dental_charts   (clinical — company-wide read)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.dental_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_dental_charts" ON public.dental_charts;
DROP POLICY IF EXISTS "select_dental_charts" ON public.dental_charts;
DROP POLICY IF EXISTS "dental_charts_select" ON public.dental_charts;
DROP POLICY IF EXISTS "dental_charts_insert" ON public.dental_charts;
DROP POLICY IF EXISTS "dental_charts_update" ON public.dental_charts;
DROP POLICY IF EXISTS "dental_charts_delete" ON public.dental_charts;

CREATE POLICY "dental_charts_select" ON public.dental_charts
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

-- Only dentist or superadmin can create/modify charts
CREATE POLICY "dental_charts_insert" ON public.dental_charts
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "dental_charts_update" ON public.dental_charts
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "dental_charts_delete" ON public.dental_charts
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 13. tooth_conditions
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_tooth_conditions" ON public.tooth_conditions;
DROP POLICY IF EXISTS "select_tooth_conditions" ON public.tooth_conditions;
DROP POLICY IF EXISTS "tooth_conditions_select" ON public.tooth_conditions;
DROP POLICY IF EXISTS "tooth_conditions_insert" ON public.tooth_conditions;
DROP POLICY IF EXISTS "tooth_conditions_update" ON public.tooth_conditions;
DROP POLICY IF EXISTS "tooth_conditions_delete" ON public.tooth_conditions;

CREATE POLICY "tooth_conditions_select" ON public.tooth_conditions
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "tooth_conditions_insert" ON public.tooth_conditions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "tooth_conditions_update" ON public.tooth_conditions
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "tooth_conditions_delete" ON public.tooth_conditions
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 14. patient_medical_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.patient_medical_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_patient_medical_history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "select_patient_medical_history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "patient_medical_history_select" ON public.patient_medical_history;
DROP POLICY IF EXISTS "patient_medical_history_insert" ON public.patient_medical_history;
DROP POLICY IF EXISTS "patient_medical_history_update" ON public.patient_medical_history;
DROP POLICY IF EXISTS "patient_medical_history_delete" ON public.patient_medical_history;

CREATE POLICY "patient_medical_history_select" ON public.patient_medical_history
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "patient_medical_history_insert" ON public.patient_medical_history
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "patient_medical_history_update" ON public.patient_medical_history
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "patient_medical_history_delete" ON public.patient_medical_history
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 15. clinical_assessments
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_clinical_assessments" ON public.clinical_assessments;
DROP POLICY IF EXISTS "select_clinical_assessments" ON public.clinical_assessments;
DROP POLICY IF EXISTS "clinical_assessments_select" ON public.clinical_assessments;
DROP POLICY IF EXISTS "clinical_assessments_insert" ON public.clinical_assessments;
DROP POLICY IF EXISTS "clinical_assessments_update" ON public.clinical_assessments;
DROP POLICY IF EXISTS "clinical_assessments_delete" ON public.clinical_assessments;

CREATE POLICY "clinical_assessments_select" ON public.clinical_assessments
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "clinical_assessments_insert" ON public.clinical_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "clinical_assessments_update" ON public.clinical_assessments
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "clinical_assessments_delete" ON public.clinical_assessments
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 16. tmj_assessments
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.tmj_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_tmj_assessments" ON public.tmj_assessments;
DROP POLICY IF EXISTS "select_tmj_assessments" ON public.tmj_assessments;
DROP POLICY IF EXISTS "tmj_assessments_select" ON public.tmj_assessments;
DROP POLICY IF EXISTS "tmj_assessments_insert" ON public.tmj_assessments;
DROP POLICY IF EXISTS "tmj_assessments_update" ON public.tmj_assessments;
DROP POLICY IF EXISTS "tmj_assessments_delete" ON public.tmj_assessments;

CREATE POLICY "tmj_assessments_select" ON public.tmj_assessments
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "tmj_assessments_insert" ON public.tmj_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "tmj_assessments_update" ON public.tmj_assessments
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "tmj_assessments_delete" ON public.tmj_assessments
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 17. periodontal_screenings
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.periodontal_screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_periodontal_screenings" ON public.periodontal_screenings;
DROP POLICY IF EXISTS "select_periodontal_screenings" ON public.periodontal_screenings;
DROP POLICY IF EXISTS "periodontal_screenings_select" ON public.periodontal_screenings;
DROP POLICY IF EXISTS "periodontal_screenings_insert" ON public.periodontal_screenings;
DROP POLICY IF EXISTS "periodontal_screenings_update" ON public.periodontal_screenings;
DROP POLICY IF EXISTS "periodontal_screenings_delete" ON public.periodontal_screenings;

CREATE POLICY "periodontal_screenings_select" ON public.periodontal_screenings
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "periodontal_screenings_insert" ON public.periodontal_screenings
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "periodontal_screenings_update" ON public.periodontal_screenings
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "periodontal_screenings_delete" ON public.periodontal_screenings
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 18. oral_surgery_records
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.oral_surgery_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_oral_surgery_records" ON public.oral_surgery_records;
DROP POLICY IF EXISTS "select_oral_surgery_records" ON public.oral_surgery_records;
DROP POLICY IF EXISTS "oral_surgery_records_select" ON public.oral_surgery_records;
DROP POLICY IF EXISTS "oral_surgery_records_insert" ON public.oral_surgery_records;
DROP POLICY IF EXISTS "oral_surgery_records_update" ON public.oral_surgery_records;
DROP POLICY IF EXISTS "oral_surgery_records_delete" ON public.oral_surgery_records;

CREATE POLICY "oral_surgery_records_select" ON public.oral_surgery_records
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "oral_surgery_records_insert" ON public.oral_surgery_records
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "oral_surgery_records_update" ON public.oral_surgery_records
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "oral_surgery_records_delete" ON public.oral_surgery_records
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 19. prescriptions
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "select_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_select" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_update" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_delete" ON public.prescriptions;

CREATE POLICY "prescriptions_select" ON public.prescriptions
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = prescriptions.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "prescriptions_insert" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "prescriptions_update" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "prescriptions_delete" ON public.prescriptions
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 20. treatment_history
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.treatment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_treatment_history" ON public.treatment_history;
DROP POLICY IF EXISTS "select_treatment_history" ON public.treatment_history;
DROP POLICY IF EXISTS "treatment_history_select" ON public.treatment_history;
DROP POLICY IF EXISTS "treatment_history_insert" ON public.treatment_history;
DROP POLICY IF EXISTS "treatment_history_update" ON public.treatment_history;
DROP POLICY IF EXISTS "treatment_history_delete" ON public.treatment_history;

CREATE POLICY "treatment_history_select" ON public.treatment_history
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "treatment_history_insert" ON public.treatment_history
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "treatment_history_update" ON public.treatment_history
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "treatment_history_delete" ON public.treatment_history
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 21. informed_consent
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.informed_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_informed_consent" ON public.informed_consent;
DROP POLICY IF EXISTS "select_informed_consent" ON public.informed_consent;
DROP POLICY IF EXISTS "informed_consent_select" ON public.informed_consent;
DROP POLICY IF EXISTS "informed_consent_insert" ON public.informed_consent;
DROP POLICY IF EXISTS "informed_consent_update" ON public.informed_consent;
DROP POLICY IF EXISTS "informed_consent_delete" ON public.informed_consent;

CREATE POLICY "informed_consent_select" ON public.informed_consent
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = informed_consent.patient_id AND p.user_id = auth.uid()
    )
  );

-- Patients insert their own consent; staff/dentist can too
CREATE POLICY "informed_consent_insert" ON public.informed_consent
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = informed_consent.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "informed_consent_update" ON public.informed_consent
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "informed_consent_delete" ON public.informed_consent
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 22. follow_up_schedules
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.follow_up_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_dentist_read_follow_up_schedules" ON public.follow_up_schedules;
DROP POLICY IF EXISTS "select_follow_up_schedules" ON public.follow_up_schedules;
DROP POLICY IF EXISTS "follow_up_schedules_select" ON public.follow_up_schedules;
DROP POLICY IF EXISTS "follow_up_schedules_insert" ON public.follow_up_schedules;
DROP POLICY IF EXISTS "follow_up_schedules_update" ON public.follow_up_schedules;
DROP POLICY IF EXISTS "follow_up_schedules_delete" ON public.follow_up_schedules;

CREATE POLICY "follow_up_schedules_select" ON public.follow_up_schedules
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = follow_up_schedules.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "follow_up_schedules_insert" ON public.follow_up_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "follow_up_schedules_update" ON public.follow_up_schedules
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "follow_up_schedules_delete" ON public.follow_up_schedules
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 23. notifications
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 24. inventory_items   (branch-specific)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_items_select" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete" ON public.inventory_items;

CREATE POLICY "inventory_items_select" ON public.inventory_items
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "inventory_items_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "inventory_items_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "inventory_items_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 25. inventory_logs   (audit, append-only)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_logs_select" ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_insert" ON public.inventory_logs;

CREATE POLICY "inventory_logs_select" ON public.inventory_logs
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "inventory_logs_insert" ON public.inventory_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 26. clinic_operating_hours   (branch-specific, public read)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_operating_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_operating_hours_select" ON public.clinic_operating_hours;
DROP POLICY IF EXISTS "clinic_operating_hours_insert" ON public.clinic_operating_hours;
DROP POLICY IF EXISTS "clinic_operating_hours_update" ON public.clinic_operating_hours;
DROP POLICY IF EXISTS "clinic_operating_hours_delete" ON public.clinic_operating_hours;

CREATE POLICY "clinic_operating_hours_select" ON public.clinic_operating_hours
  FOR SELECT USING (true);

CREATE POLICY "clinic_operating_hours_insert" ON public.clinic_operating_hours
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_operating_hours_update" ON public.clinic_operating_hours
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_operating_hours_delete" ON public.clinic_operating_hours
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 27. clinic_holidays   (branch-specific, public read)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_holidays_select" ON public.clinic_holidays;
DROP POLICY IF EXISTS "clinic_holidays_insert" ON public.clinic_holidays;
DROP POLICY IF EXISTS "clinic_holidays_update" ON public.clinic_holidays;
DROP POLICY IF EXISTS "clinic_holidays_delete" ON public.clinic_holidays;

CREATE POLICY "clinic_holidays_select" ON public.clinic_holidays
  FOR SELECT USING (true);

CREATE POLICY "clinic_holidays_insert" ON public.clinic_holidays
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_holidays_update" ON public.clinic_holidays
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_holidays_delete" ON public.clinic_holidays
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 28. clinic_gallery   (public read)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_gallery_select" ON public.clinic_gallery;
DROP POLICY IF EXISTS "clinic_gallery_insert" ON public.clinic_gallery;
DROP POLICY IF EXISTS "clinic_gallery_update" ON public.clinic_gallery;
DROP POLICY IF EXISTS "clinic_gallery_delete" ON public.clinic_gallery;

CREATE POLICY "clinic_gallery_select" ON public.clinic_gallery
  FOR SELECT USING (true);

CREATE POLICY "clinic_gallery_insert" ON public.clinic_gallery
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_gallery_update" ON public.clinic_gallery
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_gallery_delete" ON public.clinic_gallery
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 29. clinic_specialties   (public read)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_specialties_select" ON public.clinic_specialties;
DROP POLICY IF EXISTS "clinic_specialties_insert" ON public.clinic_specialties;
DROP POLICY IF EXISTS "clinic_specialties_update" ON public.clinic_specialties;
DROP POLICY IF EXISTS "clinic_specialties_delete" ON public.clinic_specialties;

CREATE POLICY "clinic_specialties_select" ON public.clinic_specialties
  FOR SELECT USING (true);

CREATE POLICY "clinic_specialties_insert" ON public.clinic_specialties
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_specialties_update" ON public.clinic_specialties
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );

CREATE POLICY "clinic_specialties_delete" ON public.clinic_specialties
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 30. feedback
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_insert_own_feedback" ON public.feedback;
DROP POLICY IF EXISTS "staff_read_feedback" ON public.feedback;
DROP POLICY IF EXISTS "feedback_select" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update" ON public.feedback;
DROP POLICY IF EXISTS "feedback_delete" ON public.feedback;

CREATE POLICY "feedback_select" ON public.feedback
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = feedback.patient_id AND p.user_id = auth.uid()
    )
  );

-- Patients submit their own feedback; app layer validates ownership
CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "feedback_delete" ON public.feedback
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin');


-- ─────────────────────────────────────────────────────────────────
-- 31. dentist_availability   (public read for booking slots)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.dentist_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dentist_availability_select" ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_availability_insert" ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_availability_update" ON public.dentist_availability;
DROP POLICY IF EXISTS "dentist_availability_delete" ON public.dentist_availability;

CREATE POLICY "dentist_availability_select" ON public.dentist_availability
  FOR SELECT USING (true);

CREATE POLICY "dentist_availability_insert" ON public.dentist_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
    OR (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'dentist'
      AND dentist_id = (SELECT id FROM public.dentists WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "dentist_availability_update" ON public.dentist_availability
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
    OR (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'dentist'
      AND dentist_id = (SELECT id FROM public.dentists WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "dentist_availability_delete" ON public.dentist_availability
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
    OR (
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'dentist'
      AND dentist_id = (SELECT id FROM public.dentists WHERE user_id = auth.uid() LIMIT 1)
    )
  );


-- ─────────────────────────────────────────────────────────────────
-- 32. dentist_blocked_slots
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.dentist_blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dentist_blocked_slots_select" ON public.dentist_blocked_slots;
DROP POLICY IF EXISTS "dentist_blocked_slots_insert" ON public.dentist_blocked_slots;
DROP POLICY IF EXISTS "dentist_blocked_slots_update" ON public.dentist_blocked_slots;
DROP POLICY IF EXISTS "dentist_blocked_slots_delete" ON public.dentist_blocked_slots;

CREATE POLICY "dentist_blocked_slots_select" ON public.dentist_blocked_slots
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'dentist', 'superadmin')
  );

CREATE POLICY "dentist_blocked_slots_insert" ON public.dentist_blocked_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "dentist_blocked_slots_update" ON public.dentist_blocked_slots
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );

CREATE POLICY "dentist_blocked_slots_delete" ON public.dentist_blocked_slots
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('dentist', 'superadmin')
  );


-- ─────────────────────────────────────────────────────────────────
-- 33. login_logs   (superadmin read-only, service-role inserts)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin_read_login_logs" ON public.login_logs;
DROP POLICY IF EXISTS "login_logs_select" ON public.login_logs;
DROP POLICY IF EXISTS "login_logs_insert" ON public.login_logs;

CREATE POLICY "login_logs_select" ON public.login_logs
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );

-- Inserts done via service-role key in server actions — no client-side insert needed
-- Keeping this open for authenticated inserts so server actions using the anon key can log
CREATE POLICY "login_logs_insert" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
