-- ============================================================
-- ADD 'partial' VALUE TO payment_status ENUM TYPE
-- Resolves database error: invalid input value for enum payment_status: "partial"
-- ============================================================

-- Add 'partial' value to the payment_status enum type in the public schema
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'partial';
