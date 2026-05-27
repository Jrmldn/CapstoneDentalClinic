-- 1. Create the corrected function (using "phone" instead of "phone_number")
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Safely extract name (handles both Google and Email signups)
  v_full_name := new.raw_user_meta_data->>'full_name';

  IF v_full_name IS NOT NULL AND TRIM(v_full_name) != '' THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := NULLIF(substring(v_full_name from position(' ' in v_full_name) + 1), '');
    
    IF v_last_name IS NULL OR v_last_name = '' THEN
      v_last_name := 'User';
    END IF;
  ELSE
    v_first_name := 'New';
    v_last_name := 'Patient';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (new.id, new.email, 'patient', NOW());

  -- Insert into public.patients (Notice the exact "phone" column here!)
  INSERT INTO public.patients (user_id, first_name, last_name, phone, created_at)
  VALUES (new.id, v_first_name, v_last_name, 'Update required', NOW());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to the auth system
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();