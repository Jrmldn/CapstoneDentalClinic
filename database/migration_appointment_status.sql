-- Migration: Add 'pending_patient_confirm' to appointment_status enum type
-- Run this in your Supabase SQL Editor to support the reschedule confirmation flow

ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'pending_patient_confirm';
