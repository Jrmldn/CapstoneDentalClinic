-- Patient access is practice-wide (role-based), not clinic-scoped.
-- Drop the stale singular policy set that gated staff/dentist reads on
-- auth_is_clinic_patient(id). The canonical role-based policies
-- (patients_select / patients_insert / patients_update / patients_delete)
-- from migration_rls_full_rewrite.sql remain as the sole policy set.
-- The auth_is_clinic_patient(...) function is left in place (now unused).

drop policy if exists "patient_read" on public.patients;
drop policy if exists "patient_update" on public.patients;
drop policy if exists "patient_insert" on public.patients;
drop policy if exists "patient_delete" on public.patients;
