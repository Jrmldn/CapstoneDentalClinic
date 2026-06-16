-- Migration: Add detailed_info JSONB column to patient_medical_history
-- Run this in your Supabase SQL Editor to support detailed medical history form fields

ALTER TABLE patient_medical_history
  ADD COLUMN IF NOT EXISTS detailed_info JSONB DEFAULT '{}'::jsonb;
