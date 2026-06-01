[
  {
    "backup_sql": "CREATE POLICY clinical_assessments_read ON clinical_assessments FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))));"
  },
  {
    "backup_sql": "CREATE POLICY clinical_assessments_write ON clinical_assessments FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY history_patient_read ON treatment_history FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY history_staff_access ON treatment_history FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY follow_up_patient_read ON follow_up_schedules FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY follow_up_staff_access ON follow_up_schedules FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY transactions_read ON transactions FOR SELECT USING (((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY transactions_write ON transactions FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY transaction_items_read ON transaction_items FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id())))) OR (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.patient_id IN ( SELECT patients.id\n           FROM patients\n          WHERE (patients.user_id = auth.uid())))))));"
  },
  {
    "backup_sql": "CREATE POLICY transaction_items_write ON transaction_items FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY inventory_read ON inventory_items FOR SELECT USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY inventory_write ON inventory_items FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY inventory_logs_read ON inventory_logs FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY inventory_logs_write ON inventory_logs FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY notifications_read ON notifications FOR SELECT USING (((auth_role() = 'superadmin'::text) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT DISTINCT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))))));"
  },
  {
    "backup_sql": "CREATE POLICY notifications_write ON notifications FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT DISTINCT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT DISTINCT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))))));"
  },
  {
    "backup_sql": "CREATE POLICY feedback_read ON feedback FOR SELECT USING (((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY feedback_write ON feedback FOR INSERT WITH CHECK (((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY patient_delete ON patients FOR DELETE USING ((auth_role() = 'superadmin'::text));"
  },
  {
    "backup_sql": "CREATE POLICY patient_insert ON patients FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY patient_read ON patients FOR SELECT USING (((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text]))));"
  },
  {
    "backup_sql": "CREATE POLICY patient_update ON patients FOR UPDATE USING (((auth.uid() = user_id) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) OR (auth_role() = 'superadmin'::text))) WITH CHECK (((auth.uid() = user_id) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY patient_write ON patients FOR ALL USING (((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])))) WITH CHECK (((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text]))));"
  },
  {
    "backup_sql": "CREATE POLICY medical_history_patient_insert ON patient_medical_history FOR INSERT WITH CHECK ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY medical_history_patient_read ON patient_medical_history FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY medical_history_staff_access ON patient_medical_history FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY appt_patient ON appointments FOR SELECT USING (((auth_role() = 'superadmin'::text) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id()))));"
  },
  {
    "backup_sql": "CREATE POLICY appt_write_policy ON appointments FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY clinics_public_browse ON clinics FOR SELECT USING (((is_active = true) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY clinics_superadmin_manage ON clinics FOR ALL USING ((auth_role() = 'superadmin'::text)) WITH CHECK ((auth_role() = 'superadmin'::text));"
  },
  {
    "backup_sql": "CREATE POLICY user_access_self ON users FOR ALL USING (((id = auth.uid()) OR (auth_role() = 'superadmin'::text))) WITH CHECK (((id = auth.uid()) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY clinic_settings_read ON clinic_operating_hours FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY clinic_settings_write ON clinic_operating_hours FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY hmo_read ON clinic_hmo FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY hmo_write ON clinic_hmo FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY gallery_read ON clinic_gallery FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY gallery_write ON clinic_gallery FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY holidays_read ON clinic_holidays FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY holidays_write ON clinic_holidays FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY personnel_management ON clinic_staff FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id()))));"
  },
  {
    "backup_sql": "CREATE POLICY personnel_read ON clinic_staff FOR SELECT USING (((clinic_id = auth_clinic_id()) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY dentists_management ON dentists FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id()))));"
  },
  {
    "backup_sql": "CREATE POLICY dentists_read ON dentists FOR SELECT USING (((clinic_id = auth_clinic_id()) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY availability_read ON dentist_availability FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY availability_write ON dentist_availability FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY blocked_slots_read ON dentist_blocked_slots FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY blocked_slots_write ON dentist_blocked_slots FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY services_read ON services FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY services_write ON services FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY tooth_conditions_read ON tooth_conditions FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id())))) OR (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.patient_id IN ( SELECT patients.id\n           FROM patients\n          WHERE (patients.user_id = auth.uid())))))));"
  },
  {
    "backup_sql": "CREATE POLICY tooth_conditions_write ON tooth_conditions FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY perio_patient_read ON periodontal_screenings FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY perio_staff_access ON periodontal_screenings FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY products_read ON products FOR SELECT USING (true);"
  },
  {
    "backup_sql": "CREATE POLICY products_write ON products FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY tmj_assessments_read ON tmj_assessments FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))));"
  },
  {
    "backup_sql": "CREATE POLICY tmj_assessments_write ON tmj_assessments FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY consent_patient_insert ON informed_consent FOR INSERT WITH CHECK ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY consent_patient_read ON informed_consent FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY consent_staff_access ON informed_consent FOR ALL USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))))) WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT appointments.patient_id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY appt_log_insert ON appointment_logs FOR INSERT WITH CHECK (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY appt_log_read ON appointment_logs FOR SELECT USING (((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id()))))));"
  },
  {
    "backup_sql": "CREATE POLICY charts_patient_read ON dental_charts FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY charts_staff_access ON dental_charts FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY surgery_patient_read ON oral_surgery_records FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY surgery_staff_access ON oral_surgery_records FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  },
  {
    "backup_sql": "CREATE POLICY rx_patient_read ON prescriptions FOR SELECT USING ((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))));"
  },
  {
    "backup_sql": "CREATE POLICY rx_staff_access ON prescriptions FOR ALL USING ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))) WITH CHECK ((((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text)));"
  }
]