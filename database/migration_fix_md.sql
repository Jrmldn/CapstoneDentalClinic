-- Migration: Add new patient profile fields (previous_dentist, guardian fields)
-- Run this in Supabase SQL Editor

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS previous_dentist TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_address TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS hmo_cards JSONB DEFAULT '[]';

-- Migration: Add new appointment fields (reschedule_count, booked_at, appointment_type)
-- Used for reschedule limit enforcement (A2) and follow-up type badge (B1)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reschedule_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'regular';
  -- appointment_type values: 'regular', 'follow_up'

-- Set booked_at for existing rows (best-effort: use created_at if available)
UPDATE appointments SET booked_at = created_at WHERE booked_at IS NULL AND created_at IS NOT NULL;

-- Migration: Feedback table (G1 — post-appointment rating)
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id     BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id      BIGINT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (appointment_id)   -- one review per appointment
);

-- Enable RLS (patients can only insert their own feedback)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_insert_own_feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- app layer validates patient ownership

CREATE POLICY "staff_read_feedback" ON feedback
  FOR SELECT TO authenticated
  USING (true);
