-- ============================================================
-- FIX PUBLIC RLS POLICIES
-- This script addresses missing policies for clinic_specialties
-- and expands feedback visibility for public clinic browsing.
-- ============================================================

-- 1. CLINIC SPECIALTIES
-- Ensure public users can see what specialties each clinic offers.
DROP POLICY IF EXISTS clinic_specialties_read ON clinic_specialties;
DROP POLICY IF EXISTS clinic_specialties_write ON clinic_specialties;

CREATE POLICY clinic_specialties_read ON clinic_specialties
  FOR SELECT USING (true);

CREATE POLICY clinic_specialties_write ON clinic_specialties
  FOR ALL
  USING (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  )
  WITH CHECK (
    (auth_role() IN ('staff', 'dentist') AND clinic_id = auth_clinic_id())
    OR auth_role() = 'superadmin'
  );


-- 2. FEEDBACK (RATINGS)
-- Expand feedback read access so public users can see clinic ratings
-- on the landing page. We keep write access restricted to patients.
DROP POLICY IF EXISTS feedback_read ON feedback;

CREATE POLICY feedback_read ON feedback
  FOR SELECT USING (true);


-- 3. DENTISTS SPECIALTIES
-- Ensure public users can see dentist names and specialties for the map/cards.
DROP POLICY IF EXISTS dentists_public_read ON dentists;

CREATE POLICY dentists_public_read ON dentists
  FOR SELECT USING (true);
