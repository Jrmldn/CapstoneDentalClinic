-- Per-service installment terms (superadmin-configured).
-- A service is installment-eligible iff allows_installment = true; downpayment_amount
-- and monthly_amount are the fixed terms used to derive the schedule.
ALTER TABLE public.services
  ADD COLUMN allows_installment boolean NOT NULL DEFAULT false,
  ADD COLUMN downpayment_amount numeric(10,2),
  ADD COLUMN monthly_amount     numeric(10,2);

-- No penalty/late-fee model anywhere in installments.
ALTER TABLE public.installment_plans
  DROP COLUMN IF EXISTS penalty_type,
  DROP COLUMN IF EXISTS penalty_value;

ALTER TABLE public.installment_payments
  DROP COLUMN IF EXISTS penalty_amount;
