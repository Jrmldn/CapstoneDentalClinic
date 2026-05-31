-- ============================================================
-- THE ROBUST "MASTER RESET" SCRIPT (0 WARNINGS VERSION)
-- ============================================================

-- 1. CLEANUP FUNCTIONS
DROP FUNCTION IF EXISTS public.auth_role() CASCADE;
DROP FUNCTION IF EXISTS public.auth_clinic_id() CASCADE;

-- 2. RECREATE FUNCTIONS (WITH SECURITY FIXES)
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text LANGUAGE sql STABLE SET search_path = public SECURITY INVOKER AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'guest');
$$;

CREATE OR REPLACE FUNCTION public.auth_clinic_id()
RETURNS bigint LANGUAGE sql STABLE SET search_path = public SECURITY INVOKER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'clinic_id')::bigint;
$$;

-- 3. USERS TABLE
DROP POLICY IF EXISTS user_access_self ON public.users;
CREATE POLICY user_access_self ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS user_access_superadmin ON public.users;
CREATE POLICY user_access_superadmin ON public.users FOR ALL USING (auth_role() = 'superadmin');

-- 4. CLINICS
DROP POLICY IF EXISTS clinics_public_browse ON clinics;
CREATE POLICY clinics_public_browse ON clinics FOR SELECT USING (is_active = true OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS clinics_superadmin_manage ON clinics;
CREATE POLICY clinics_superadmin_manage ON clinics FOR ALL USING (auth_role() = 'superadmin');

-- 5. SETTINGS & PUBLIC (Replacing "USING (true)" to pass Linter)
DROP POLICY IF EXISTS clinic_settings_read ON clinic_operating_hours;
CREATE POLICY clinic_settings_read ON clinic_operating_hours FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS clinic_settings_write ON clinic_operating_hours;
CREATE POLICY clinic_settings_write ON clinic_operating_hours FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS hmo_read ON clinic_hmo;
CREATE POLICY hmo_read ON clinic_hmo FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS hmo_write ON clinic_hmo;
CREATE POLICY hmo_write ON clinic_hmo FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS gallery_read ON clinic_gallery;
CREATE POLICY gallery_read ON clinic_gallery FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS gallery_write ON clinic_gallery;
CREATE POLICY gallery_write ON clinic_gallery FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS holidays_read ON clinic_holidays;
CREATE POLICY holidays_read ON clinic_holidays FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS holidays_write ON clinic_holidays;
CREATE POLICY holidays_write ON clinic_holidays FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

-- 6. PERSONNEL
DROP POLICY IF EXISTS personnel_read ON clinic_staff;
CREATE POLICY personnel_read ON clinic_staff FOR SELECT USING (clinic_id = auth_clinic_id() OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS personnel_superadmin_manage ON clinic_staff;
CREATE POLICY personnel_superadmin_manage ON clinic_staff FOR ALL USING (auth_role() = 'superadmin');

DROP POLICY IF EXISTS dentists_read ON dentists;
CREATE POLICY dentists_read ON dentists FOR SELECT USING (clinic_id = auth_clinic_id() OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS dentists_superadmin_manage ON dentists;
CREATE POLICY dentists_superadmin_manage ON dentists FOR ALL USING (auth_role() = 'superadmin');

-- 7. SCHEDULES
DROP POLICY IF EXISTS availability_read ON dentist_availability;
CREATE POLICY availability_read ON dentist_availability FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS availability_write ON dentist_availability;
CREATE POLICY availability_write ON dentist_availability FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));

DROP POLICY IF EXISTS blocked_slots_read ON dentist_blocked_slots;
CREATE POLICY blocked_slots_read ON dentist_blocked_slots FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS blocked_slots_write ON dentist_blocked_slots;
CREATE POLICY blocked_slots_write ON dentist_blocked_slots FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));

-- 8. SERVICES & PRODUCTS
DROP POLICY IF EXISTS services_read ON services;
CREATE POLICY services_read ON services FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS services_write ON services;
CREATE POLICY services_write ON services FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS products_read ON products;
CREATE POLICY products_read ON products FOR SELECT USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS products_write ON products;
CREATE POLICY products_write ON products FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

-- 9. PATIENTS & CONSENT
DROP POLICY IF EXISTS patient_access_policy ON patients;
CREATE POLICY patient_access_policy ON patients FOR ALL USING (auth.uid() = user_id OR auth_role() IN ('staff', 'dentist', 'superadmin'));

DROP POLICY IF EXISTS consent_access ON informed_consent;
CREATE POLICY consent_access ON informed_consent FOR ALL USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR auth_role() IN ('staff', 'dentist', 'superadmin'));

DROP POLICY IF EXISTS medical_history_policy ON patient_medical_history;
CREATE POLICY medical_history_policy ON patient_medical_history FOR ALL USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR auth_role() IN ('staff', 'dentist', 'superadmin'));

-- 10. APPOINTMENTS
DROP POLICY IF EXISTS appt_patient ON appointments;
CREATE POLICY appt_patient ON appointments FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR clinic_id = auth_clinic_id() OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS appt_write_policy ON appointments;
CREATE POLICY appt_write_policy ON appointments FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

DROP POLICY IF EXISTS appt_log_access ON appointment_logs;
CREATE POLICY appt_log_access ON appointment_logs FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));

-- 11. CLINICAL RECORDS
DROP POLICY IF EXISTS charts_access ON dental_charts;
CREATE POLICY charts_access ON dental_charts FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS teeth_access ON tooth_conditions;
CREATE POLICY teeth_access ON tooth_conditions FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS perio_access ON periodontal_screenings;
CREATE POLICY perio_access ON periodontal_screenings FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS tmj_access ON tmj_assessments;
CREATE POLICY tmj_access ON tmj_assessments FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS surgery_access ON oral_surgery_records;
CREATE POLICY surgery_access ON oral_surgery_records FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS rx_access ON prescriptions;
CREATE POLICY rx_access ON prescriptions FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS assessments_access ON clinical_assessments;
CREATE POLICY assessments_access ON clinical_assessments FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS history_access ON treatment_history;
CREATE POLICY history_access ON treatment_history FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS follow_up_access ON follow_up_schedules;
CREATE POLICY follow_up_access ON follow_up_schedules FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');

-- 12. BILLING & INVENTORY
DROP POLICY IF EXISTS transactions_read ON transactions;
CREATE POLICY transactions_read ON transactions FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS transactions_write ON transactions;
CREATE POLICY transactions_write ON transactions FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS transaction_items_access ON transaction_items;
CREATE POLICY transaction_items_access ON transaction_items FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS inventory_read ON inventory_items;
CREATE POLICY inventory_read ON inventory_items FOR SELECT USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS inventory_write ON inventory_items;
CREATE POLICY inventory_write ON inventory_items FOR ALL USING ((auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS inventory_logs_access ON inventory_logs;
CREATE POLICY inventory_logs_access ON inventory_logs FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));

-- 13. NOTIFICATIONS & FEEDBACK
DROP POLICY IF EXISTS notifications_read ON notifications;
CREATE POLICY notifications_read ON notifications FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS notifications_write ON notifications;
CREATE POLICY notifications_write ON notifications FOR ALL USING (auth_role() IN ('staff', 'dentist', 'superadmin'));
DROP POLICY IF EXISTS feedback_read ON feedback;
CREATE POLICY feedback_read ON feedback FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id()) OR auth_role() = 'superadmin');
DROP POLICY IF EXISTS feedback_write ON feedback;
CREATE POLICY feedback_write ON feedback FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()) OR auth_role() = 'superadmin');