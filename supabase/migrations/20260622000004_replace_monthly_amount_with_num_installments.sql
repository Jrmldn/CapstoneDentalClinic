ALTER TABLE public.services
  DROP COLUMN monthly_amount,
  ADD COLUMN num_installments integer;
