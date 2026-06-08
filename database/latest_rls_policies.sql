[
  {
    "table_name": "appointment_logs",
    "policy_name": "appt_log_insert",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "appointment_logs",
    "policy_name": "appt_log_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))))",
    "with_check_expression": null
  },
  {
    "table_name": "appointments",
    "policy_name": "appt_patient",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())))",
    "with_check_expression": null
  },
  {
    "table_name": "appointments",
    "policy_name": "appt_write_policy",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_gallery",
    "policy_name": "gallery_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_gallery",
    "policy_name": "gallery_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_hmo",
    "policy_name": "hmo_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_hmo",
    "policy_name": "hmo_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_holidays",
    "policy_name": "holidays_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_holidays",
    "policy_name": "holidays_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_operating_hours",
    "policy_name": "clinic_settings_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_operating_hours",
    "policy_name": "clinic_settings_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_patients",
    "policy_name": "clinic_patients_delete",
    "operation": "DELETE",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())))",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_patients",
    "policy_name": "clinic_patients_insert",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())))"
  },
  {
    "table_name": "clinic_patients",
    "policy_name": "clinic_patients_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (EXISTS ( SELECT 1\n   FROM patients p\n  WHERE ((p.id = clinic_patients.patient_id) AND (p.user_id = auth.uid())))))",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_patients",
    "policy_name": "clinic_patients_update",
    "operation": "UPDATE",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())))"
  },
  {
    "table_name": "clinic_specialties",
    "policy_name": "clinic_specialties_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "clinic_specialties",
    "policy_name": "clinic_specialties_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinic_staff",
    "policy_name": "personnel_management",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))"
  },
  {
    "table_name": "clinic_staff",
    "policy_name": "personnel_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((clinic_id = auth_clinic_id()) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": null
  },
  {
    "table_name": "clinical_assessments",
    "policy_name": "clinical_assessments_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))))",
    "with_check_expression": null
  },
  {
    "table_name": "clinical_assessments",
    "policy_name": "clinical_assessments_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "clinics",
    "policy_name": "clinics_public_browse",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((is_active = true) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": null
  },
  {
    "table_name": "clinics",
    "policy_name": "clinics_superadmin_manage",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(auth_role() = 'superadmin'::text)",
    "with_check_expression": "(auth_role() = 'superadmin'::text)"
  },
  {
    "table_name": "dental_charts",
    "policy_name": "charts_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "dental_charts",
    "policy_name": "charts_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "dentist_availability",
    "policy_name": "availability_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "dentist_availability",
    "policy_name": "availability_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "dentist_blocked_slots",
    "policy_name": "blocked_slots_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "dentist_blocked_slots",
    "policy_name": "blocked_slots_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dentist_id IN ( SELECT dentists.id\n   FROM dentists\n  WHERE (dentists.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "dentists",
    "policy_name": "dentists_management",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = 'staff'::text) AND (clinic_id = auth_clinic_id())))"
  },
  {
    "table_name": "dentists",
    "policy_name": "dentists_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((clinic_id = auth_clinic_id()) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": null
  },
  {
    "table_name": "feedback",
    "policy_name": "feedback_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "feedback",
    "policy_name": "feedback_write",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "follow_up_schedules",
    "policy_name": "follow_up_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "follow_up_schedules",
    "policy_name": "follow_up_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "informed_consent",
    "policy_name": "consent_patient_insert",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))"
  },
  {
    "table_name": "informed_consent",
    "policy_name": "consent_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "informed_consent",
    "policy_name": "consent_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "inventory_items",
    "policy_name": "inventory_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": null
  },
  {
    "table_name": "inventory_items",
    "policy_name": "inventory_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "inventory_logs",
    "policy_name": "inventory_logs_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id())))))",
    "with_check_expression": null
  },
  {
    "table_name": "inventory_logs",
    "policy_name": "inventory_logs_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (item_id IN ( SELECT inventory_items.id\n   FROM inventory_items\n  WHERE (inventory_items.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "notifications",
    "policy_name": "notifications_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))))",
    "with_check_expression": null
  },
  {
    "table_name": "notifications",
    "policy_name": "notifications_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (((appointment_id IS NOT NULL) AND (appointment_id IN ( SELECT appointments.id\n   FROM appointments\n  WHERE (appointments.clinic_id = auth_clinic_id())))) OR ((appointment_id IS NULL) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))))"
  },
  {
    "table_name": "oral_surgery_records",
    "policy_name": "surgery_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "oral_surgery_records",
    "policy_name": "surgery_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "patient_medical_history",
    "policy_name": "medical_history_patient_insert",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))"
  },
  {
    "table_name": "patient_medical_history",
    "policy_name": "medical_history_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "patient_medical_history",
    "policy_name": "medical_history_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (patient_id IN ( SELECT cp.patient_id\n   FROM clinic_patients cp\n  WHERE (cp.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "patients",
    "policy_name": "patient_delete",
    "operation": "DELETE",
    "applied_roles": "{public}",
    "using_expression": "(auth_role() = 'superadmin'::text)",
    "with_check_expression": null
  },
  {
    "table_name": "patients",
    "policy_name": "patient_insert",
    "operation": "INSERT",
    "applied_roles": "{public}",
    "using_expression": null,
    "with_check_expression": "((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR (auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])))"
  },
  {
    "table_name": "patients",
    "policy_name": "patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (EXISTS ( SELECT 1\n   FROM clinic_patients cp\n  WHERE ((cp.patient_id = patients.id) AND (cp.clinic_id = auth_clinic_id()))))))",
    "with_check_expression": null
  },
  {
    "table_name": "patients",
    "policy_name": "patient_update",
    "operation": "UPDATE",
    "applied_roles": "{public}",
    "using_expression": "((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (EXISTS ( SELECT 1\n   FROM clinic_patients cp\n  WHERE ((cp.patient_id = patients.id) AND (cp.clinic_id = auth_clinic_id()))))))",
    "with_check_expression": "((auth.uid() = user_id) OR (auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (EXISTS ( SELECT 1\n   FROM clinic_patients cp\n  WHERE ((cp.patient_id = patients.id) AND (cp.clinic_id = auth_clinic_id()))))))"
  },
  {
    "table_name": "periodontal_screenings",
    "policy_name": "perio_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "periodontal_screenings",
    "policy_name": "perio_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "prescriptions",
    "policy_name": "rx_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "prescriptions",
    "policy_name": "rx_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "products",
    "policy_name": "products_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "products",
    "policy_name": "products_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "services",
    "policy_name": "services_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "true",
    "with_check_expression": null
  },
  {
    "table_name": "services",
    "policy_name": "services_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "tmj_assessments",
    "policy_name": "tmj_assessments_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))))",
    "with_check_expression": null
  },
  {
    "table_name": "tmj_assessments",
    "policy_name": "tmj_assessments_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "tooth_conditions",
    "policy_name": "tooth_conditions_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id())))) OR (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.patient_id IN ( SELECT patients.id\n           FROM patients\n          WHERE (patients.user_id = auth.uid()))))))",
    "with_check_expression": null
  },
  {
    "table_name": "tooth_conditions",
    "policy_name": "tooth_conditions_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (dental_chart_id IN ( SELECT dental_charts.id\n   FROM dental_charts\n  WHERE (dental_charts.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "transaction_items",
    "policy_name": "transaction_items_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id())))) OR (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.patient_id IN ( SELECT patients.id\n           FROM patients\n          WHERE (patients.user_id = auth.uid()))))))",
    "with_check_expression": null
  },
  {
    "table_name": "transaction_items",
    "policy_name": "transaction_items_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id())))))",
    "with_check_expression": "((auth_role() = 'superadmin'::text) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (transaction_id IN ( SELECT transactions.id\n   FROM transactions\n  WHERE (transactions.clinic_id = auth_clinic_id())))))"
  },
  {
    "table_name": "transactions",
    "policy_name": "transactions_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "((patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid()))) OR ((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": null
  },
  {
    "table_name": "transactions",
    "policy_name": "transactions_write",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "treatment_history",
    "policy_name": "history_patient_read",
    "operation": "SELECT",
    "applied_roles": "{public}",
    "using_expression": "(patient_id IN ( SELECT patients.id\n   FROM patients\n  WHERE (patients.user_id = auth.uid())))",
    "with_check_expression": null
  },
  {
    "table_name": "treatment_history",
    "policy_name": "history_staff_access",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "(((auth_role() = ANY (ARRAY['staff'::text, 'dentist'::text])) AND (clinic_id = auth_clinic_id())) OR (auth_role() = 'superadmin'::text))"
  },
  {
    "table_name": "users",
    "policy_name": "user_access_self",
    "operation": "ALL",
    "applied_roles": "{public}",
    "using_expression": "((id = auth.uid()) OR (auth_role() = 'superadmin'::text))",
    "with_check_expression": "((id = auth.uid()) OR (auth_role() = 'superadmin'::text))"
  }
]