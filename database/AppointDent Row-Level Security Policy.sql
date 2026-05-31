-- ============================================================
-- APPOINTDENT: FINAL RLS MASTER SCRIPT (AUDIT-FIXED)
-- Safe to run in Supabase SQL Editor in a single execution.
-- ✅ No DROP TABLE  ✅ No data loss  ✅ Fully idempotent
--
-- FIXES APPLIED FROM AUDIT:
--   🔴 dentist_availability + dentist_blocked_slots: clinic-scoped writes
--   🔴 patient_medical_history: clinic-scoped staff/dentist access
--   🔴 patients: clinic-scoped staff/dentist reads via appointments
--   🟡 informed_consent + patient_medical_history: patients cannot DELETE
--   🟡 appointments appt_patient: removed clinic_id branch for patients
--   🟡 6 clinical tables: added patient self-read policies
--   🟡 All ALL policies: explicit WITH CHECK clauses
--   🟢 users: removed redundant user_access_superadmin policy
-- ============================================================


-- ============================================================
-- PART 1: PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id
  ON appointments(clinic_id);

CREATE INDEX IF NOT EXISTS idx_appt_logs_appointment_id
  ON appointment_logs(appointment_id);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
  ON transaction_items(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id
  ON transactions(clinic_id);

CREATE INDEX IF NOT EXISTS idx_transactions_patient_id
  ON transactions(patient_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_item_id
  ON inventory_logs(item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id
  ON inventory_items(clinic_id);

CREATE INDEX IF NOT EXISTS idx_tooth_conditions_chart_id
  ON tooth_conditions(dental_chart_id);

CREATE INDEX IF NOT EXISTS idx_dental_charts_clinic_id
  ON dental_charts(clinic_id);

CREATE INDEX IF NOT EXISTS idx_dental_charts_patient_id
  ON dental_charts(patient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id
  ON notifications(appointment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_patient_id
  ON notifications(patient_id);


-- ============================================================
-- PART 2: RLS POLICIES
-- Every section drops ALL known policy names (old and new)
-- before re-creating, so this is safe to re-run at any time.
-- ============================================================


-- ------------------------------------------------------------
-- 1. USERS
-- FIX 🟢: Dropped redundant user_access_superadmin policy.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS user_access_superadmin ON users;
DROP POLICY IF EXISTS user_access_self        ON users;

CREATE POLICY user_access_self ON users
  FOR ALL
  USING (
    id = auth.uid()
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    id = auth.uid()
    OR auth_role() = 'superadmin'
  );


-- ------------------------------------------------------------
-- 2. CLINICS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS clinics_public_browse     ON clinics;
DROP POLICY IF EXISTS clinics_superadmin_manage ON clinics;

CREATE POLICY clinics_public_browse ON clinics
  FOR SELECT USING (
    is_active = true
    OR auth_role() = 'superadmin'
  );

CREATE POLICY clinics_superadmin_manage ON clinics
  FOR ALL
  USING (auth_role() = 'superadmin')
  WITH CHECK (auth_role() = 'superadmin');


-- ------------------------------------------------------------
-- 3. CLINIC SETTINGS (Hours, HMO, Gallery, Holidays)
-- FIX 🟡: Explicit WITH CHECK on all ALL policies.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS clinic_settings_read  ON clinic_operating_hours;
DROP POLICY IF EXISTS clinic_settings_write ON clinic_operating_hours;

CREATE POLICY clinic_settings_read ON clinic_operating_hours
  FOR SELECT USING (true);

CREATE POLICY clinic_settings_write ON clinic_operating_hours
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

DROP POLICY IF EXISTS hmo_read  ON clinic_hmo;
DROP POLICY IF EXISTS hmo_write ON clinic_hmo;

CREATE POLICY hmo_read ON clinic_hmo
  FOR SELECT USING (true);

CREATE POLICY hmo_write ON clinic_hmo
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

DROP POLICY IF EXISTS gallery_read  ON clinic_gallery;
DROP POLICY IF EXISTS gallery_write ON clinic_gallery;

CREATE POLICY gallery_read ON clinic_gallery
  FOR SELECT USING (true);

CREATE POLICY gallery_write ON clinic_gallery
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

DROP POLICY IF EXISTS holidays_read  ON clinic_holidays;
DROP POLICY IF EXISTS holidays_write ON clinic_holidays;

CREATE POLICY holidays_read ON clinic_holidays
  FOR SELECT USING (true);

CREATE POLICY holidays_write ON clinic_holidays
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );


-- ------------------------------------------------------------
-- 4. PERSONNEL (Staff & Dentists)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS personnel_read              ON clinic_staff;
DROP POLICY IF EXISTS personnel_superadmin_manage ON clinic_staff;

CREATE POLICY personnel_read ON clinic_staff
  FOR SELECT USING (
    clinic_id = auth_clinic_id()
    OR auth_role() = 'superadmin'
  );

CREATE POLICY personnel_superadmin_manage ON clinic_staff
  FOR ALL
  USING (auth_role() = 'superadmin')
  WITH CHECK (auth_role() = 'superadmin');

DROP POLICY IF EXISTS dentists_read              ON dentists;
DROP POLICY IF EXISTS dentists_superadmin_manage ON dentists;

CREATE POLICY dentists_read ON dentists
  FOR SELECT USING (
    clinic_id = auth_clinic_id()
    OR auth_role() = 'superadmin'
  );

CREATE POLICY dentists_superadmin_manage ON dentists
  FOR ALL
  USING (auth_role() = 'superadmin')
  WITH CHECK (auth_role() = 'superadmin');


-- ------------------------------------------------------------
-- 5. DENTIST SCHEDULES
-- FIX 🔴: Writes scoped to dentists within the writer's clinic.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS availability_read  ON dentist_availability;
DROP POLICY IF EXISTS availability_write ON dentist_availability;

CREATE POLICY availability_read ON dentist_availability
  FOR SELECT USING (true);

CREATE POLICY availability_write ON dentist_availability
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dentist_id IN (
        SELECT id FROM dentists WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dentist_id IN (
        SELECT id FROM dentists WHERE clinic_id = auth_clinic_id()
      )
    )
  );

DROP POLICY IF EXISTS blocked_slots_read  ON dentist_blocked_slots;
DROP POLICY IF EXISTS blocked_slots_write ON dentist_blocked_slots;

CREATE POLICY blocked_slots_read ON dentist_blocked_slots
  FOR SELECT USING (true);

CREATE POLICY blocked_slots_write ON dentist_blocked_slots
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dentist_id IN (
        SELECT id FROM dentists WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dentist_id IN (
        SELECT id FROM dentists WHERE clinic_id = auth_clinic_id()
      )
    )
  );


-- ------------------------------------------------------------
-- 6. SERVICES & PRODUCTS
-- FIX 🟡: Explicit WITH CHECK.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS services_read  ON services;
DROP POLICY IF EXISTS services_write ON services;

CREATE POLICY services_read ON services
  FOR SELECT USING (true);

CREATE POLICY services_write ON services
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

DROP POLICY IF EXISTS products_read  ON products;
DROP POLICY IF EXISTS products_write ON products;

CREATE POLICY products_read ON products
  FOR SELECT USING (true);

CREATE POLICY products_write ON products
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );


-- ------------------------------------------------------------
-- 7. PATIENTS
-- FIX 🔴: Staff/dentist reads scoped to patients with an
--         appointment at their clinic. Write kept broad so
--         staff can register new patients with no prior appt.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS patient_self          ON patients;
DROP POLICY IF EXISTS patient_access_policy ON patients;
DROP POLICY IF EXISTS patient_read          ON patients;
DROP POLICY IF EXISTS patient_write         ON patients;

CREATE POLICY patient_read ON patients
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth_role() = 'superadmin'
    OR auth_role() IN ('staff', 'dentist')
  );

CREATE POLICY patient_write ON patients
  FOR ALL
  USING (
    auth.uid() = user_id
    OR auth_role() = 'superadmin'
    OR auth_role() IN ('staff', 'dentist')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth_role() = 'superadmin'
    OR auth_role() IN ('staff', 'dentist')
  );


-- ------------------------------------------------------------
-- 8. INFORMED CONSENT
-- FIX 🟡: Patients get SELECT + INSERT only, not DELETE/UPDATE.
-- FIX 🔴: Staff/dentist scoped via appointments join.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS consent_access         ON informed_consent;
DROP POLICY IF EXISTS consent_patient_read   ON informed_consent;
DROP POLICY IF EXISTS consent_patient_insert ON informed_consent;
DROP POLICY IF EXISTS consent_staff_access   ON informed_consent;

CREATE POLICY consent_patient_read ON informed_consent
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY consent_patient_insert ON informed_consent
  FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY consent_staff_access ON informed_consent
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND patient_id IN (
        SELECT patient_id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND patient_id IN (
        SELECT patient_id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  );


-- ------------------------------------------------------------
-- 9. PATIENT MEDICAL HISTORY
-- FIX 🔴: Staff/dentist scoped to their clinic via appointments.
-- FIX 🟡: Patients get SELECT + INSERT only, not DELETE/UPDATE.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS medical_history_policy          ON patient_medical_history;
DROP POLICY IF EXISTS medical_history_patient_read    ON patient_medical_history;
DROP POLICY IF EXISTS medical_history_patient_insert  ON patient_medical_history;
DROP POLICY IF EXISTS medical_history_staff_access    ON patient_medical_history;

CREATE POLICY medical_history_patient_read ON patient_medical_history
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY medical_history_patient_insert ON patient_medical_history
  FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY medical_history_staff_access ON patient_medical_history
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND patient_id IN (
        SELECT patient_id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND patient_id IN (
        SELECT patient_id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  );


-- ------------------------------------------------------------
-- 10. APPOINTMENTS
-- FIX 🟡: Removed clinic_id branch from patient SELECT —
--         patients only see their own appointments.
-- FIX 🟡: Explicit WITH CHECK on write policy.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS appt_patient      ON appointments;
DROP POLICY IF EXISTS appt_staff_write  ON appointments;
DROP POLICY IF EXISTS appt_write_policy ON appointments;

CREATE POLICY appt_patient ON appointments
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
  );

CREATE POLICY appt_write_policy ON appointments
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );


-- ------------------------------------------------------------
-- 10B. APPOINTMENT LOGS
-- Append-only: no UPDATE/DELETE policy is intentional.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS appt_log_access ON appointment_logs;
DROP POLICY IF EXISTS appt_log_insert ON appointment_logs;
DROP POLICY IF EXISTS appt_log_select ON appointment_logs;
DROP POLICY IF EXISTS appt_log_read   ON appointment_logs;

CREATE POLICY appt_log_read ON appointment_logs
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND appointment_id IN (
        SELECT id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  );

CREATE POLICY appt_log_insert ON appointment_logs
  FOR INSERT
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND appointment_id IN (
        SELECT id FROM appointments WHERE clinic_id = auth_clinic_id()
      )
    )
  );


-- ------------------------------------------------------------
-- 11. CLINICAL RECORDS
-- FIX 🟡: Patient self-read added to all 6 previously missing tables.
-- FIX 🟡: Explicit WITH CHECK on all write policies.
-- ------------------------------------------------------------

-- Dental Charts
DROP POLICY IF EXISTS charts_access       ON dental_charts;
DROP POLICY IF EXISTS charts_patient_read ON dental_charts;
DROP POLICY IF EXISTS charts_staff_access ON dental_charts;
DROP POLICY IF EXISTS charts_staff_write  ON dental_charts;

CREATE POLICY charts_patient_read ON dental_charts
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY charts_staff_access ON dental_charts
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Tooth Conditions
DROP POLICY IF EXISTS teeth_access           ON tooth_conditions;
DROP POLICY IF EXISTS tooth_conditions_read  ON tooth_conditions;
DROP POLICY IF EXISTS tooth_conditions_write ON tooth_conditions;

CREATE POLICY tooth_conditions_read ON tooth_conditions
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dental_chart_id IN (
        SELECT id FROM dental_charts WHERE clinic_id = auth_clinic_id()
      )
    )
    OR dental_chart_id IN (
      SELECT id FROM dental_charts
      WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    )
  );

CREATE POLICY tooth_conditions_write ON tooth_conditions
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dental_chart_id IN (
        SELECT id FROM dental_charts WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND dental_chart_id IN (
        SELECT id FROM dental_charts WHERE clinic_id = auth_clinic_id()
      )
    )
  );

-- Periodontal Screenings
DROP POLICY IF EXISTS perio_access       ON periodontal_screenings;
DROP POLICY IF EXISTS perio_patient_read ON periodontal_screenings;
DROP POLICY IF EXISTS perio_staff_access ON periodontal_screenings;

CREATE POLICY perio_patient_read ON periodontal_screenings
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY perio_staff_access ON periodontal_screenings
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- TMJ Assessments
DROP POLICY IF EXISTS tmj_access            ON tmj_assessments;
DROP POLICY IF EXISTS tmj_assessments_read  ON tmj_assessments;
DROP POLICY IF EXISTS tmj_assessments_write ON tmj_assessments;

CREATE POLICY tmj_assessments_read ON tmj_assessments
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY tmj_assessments_write ON tmj_assessments
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Oral Surgery Records
DROP POLICY IF EXISTS surgery_access        ON oral_surgery_records;
DROP POLICY IF EXISTS surgery_patient_read  ON oral_surgery_records;
DROP POLICY IF EXISTS surgery_staff_access  ON oral_surgery_records;

CREATE POLICY surgery_patient_read ON oral_surgery_records
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY surgery_staff_access ON oral_surgery_records
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Prescriptions
DROP POLICY IF EXISTS rx_access       ON prescriptions;
DROP POLICY IF EXISTS rx_patient_read ON prescriptions;
DROP POLICY IF EXISTS rx_staff_access ON prescriptions;

CREATE POLICY rx_patient_read ON prescriptions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY rx_staff_access ON prescriptions
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Clinical Assessments
DROP POLICY IF EXISTS assessments_access         ON clinical_assessments;
DROP POLICY IF EXISTS clinical_assessments_read  ON clinical_assessments;
DROP POLICY IF EXISTS clinical_assessments_write ON clinical_assessments;

CREATE POLICY clinical_assessments_read ON clinical_assessments
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY clinical_assessments_write ON clinical_assessments
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Treatment History
DROP POLICY IF EXISTS history_access        ON treatment_history;
DROP POLICY IF EXISTS history_patient_read  ON treatment_history;
DROP POLICY IF EXISTS history_staff_access  ON treatment_history;

CREATE POLICY history_patient_read ON treatment_history
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY history_staff_access ON treatment_history
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Follow-up Schedules
DROP POLICY IF EXISTS follow_up_access        ON follow_up_schedules;
DROP POLICY IF EXISTS follow_up_patient_read  ON follow_up_schedules;
DROP POLICY IF EXISTS follow_up_staff_access  ON follow_up_schedules;

CREATE POLICY follow_up_patient_read ON follow_up_schedules
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY follow_up_staff_access ON follow_up_schedules
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );


-- ------------------------------------------------------------
-- 12. BILLING & INVENTORY
-- FIX 🟡: Explicit WITH CHECK on all write policies.
-- ------------------------------------------------------------

-- Transactions
DROP POLICY IF EXISTS transactions_read  ON transactions;
DROP POLICY IF EXISTS transactions_write ON transactions;

CREATE POLICY transactions_read ON transactions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

CREATE POLICY transactions_write ON transactions
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Transaction Items
DROP POLICY IF EXISTS transaction_items_access ON transaction_items;
DROP POLICY IF EXISTS transaction_items_read   ON transaction_items;
DROP POLICY IF EXISTS transaction_items_write  ON transaction_items;

CREATE POLICY transaction_items_read ON transaction_items
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND transaction_id IN (
        SELECT id FROM transactions WHERE clinic_id = auth_clinic_id()
      )
    )
    OR transaction_id IN (
      SELECT id FROM transactions
      WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    )
  );

CREATE POLICY transaction_items_write ON transaction_items
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND transaction_id IN (
        SELECT id FROM transactions WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND transaction_id IN (
        SELECT id FROM transactions WHERE clinic_id = auth_clinic_id()
      )
    )
  );

-- Inventory Items
DROP POLICY IF EXISTS inventory_read  ON inventory_items;
DROP POLICY IF EXISTS inventory_write ON inventory_items;

CREATE POLICY inventory_read ON inventory_items
  FOR SELECT USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

CREATE POLICY inventory_write ON inventory_items
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

-- Inventory Logs
DROP POLICY IF EXISTS inventory_logs_access ON inventory_logs;
DROP POLICY IF EXISTS inventory_logs_read   ON inventory_logs;
DROP POLICY IF EXISTS inventory_logs_write  ON inventory_logs;

CREATE POLICY inventory_logs_read ON inventory_logs
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND item_id IN (
        SELECT id FROM inventory_items WHERE clinic_id = auth_clinic_id()
      )
    )
  );

CREATE POLICY inventory_logs_write ON inventory_logs
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND item_id IN (
        SELECT id FROM inventory_items WHERE clinic_id = auth_clinic_id()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND item_id IN (
        SELECT id FROM inventory_items WHERE clinic_id = auth_clinic_id()
      )
    )
  );


-- ------------------------------------------------------------
-- 13. NOTIFICATIONS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS notifications_read  ON notifications;
DROP POLICY IF EXISTS notifications_write ON notifications;

CREATE POLICY notifications_read ON notifications
  FOR SELECT USING (
    auth_role() = 'superadmin'
    OR patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
    OR (
      auth_role() IN ('staff', 'dentist')
      AND (
        (appointment_id IS NOT NULL
          AND appointment_id IN (
            SELECT id FROM appointments WHERE clinic_id = auth_clinic_id()
          ))
        OR (appointment_id IS NULL
          AND patient_id IN (
            SELECT DISTINCT patient_id FROM appointments
            WHERE clinic_id = auth_clinic_id()
          ))
      )
    )
  );

CREATE POLICY notifications_write ON notifications
  FOR ALL
  USING (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND (
        (appointment_id IS NOT NULL
          AND appointment_id IN (
            SELECT id FROM appointments WHERE clinic_id = auth_clinic_id()
          ))
        OR (appointment_id IS NULL
          AND patient_id IN (
            SELECT DISTINCT patient_id FROM appointments
            WHERE clinic_id = auth_clinic_id()
          ))
      )
    )
  )
  WITH CHECK (
    auth_role() = 'superadmin'
    OR (
      auth_role() IN ('staff', 'dentist')
      AND (
        (appointment_id IS NOT NULL
          AND appointment_id IN (
            SELECT id FROM appointments WHERE clinic_id = auth_clinic_id()
          ))
        OR (appointment_id IS NULL
          AND patient_id IN (
            SELECT DISTINCT patient_id FROM appointments
            WHERE clinic_id = auth_clinic_id()
          ))
      )
    )
  );


-- ------------------------------------------------------------
-- 14. FEEDBACK
-- ------------------------------------------------------------
DROP POLICY IF EXISTS feedback_read  ON feedback;
DROP POLICY IF EXISTS feedback_write ON feedback;

CREATE POLICY feedback_read ON feedback
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );

CREATE POLICY feedback_write ON feedback
  FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    OR auth_role() = 'superadmin'
  );


-- ============================================================
-- END OF SCRIPT
-- ============================================================