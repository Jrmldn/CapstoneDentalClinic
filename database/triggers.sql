CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_space_pos INT;
BEGIN
  v_full_name := TRIM(new.raw_user_meta_data->>'full_name');

  IF v_full_name IS NOT NULL AND v_full_name != '' THEN
    v_space_pos := position(' ' in v_full_name);
    IF v_space_pos > 0 THEN
      v_first_name := substring(v_full_name from 1 for v_space_pos - 1);
      v_last_name := TRIM(substring(v_full_name from v_space_pos + 1));
    ELSE
      v_first_name := v_full_name;
      v_last_name := 'User';
    END IF;
  ELSE
    v_first_name := 'New';
    v_last_name := 'Patient';
  END IF;

  -- 1. Insert into your public profile tables
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (new.id, new.email, 'patient', NOW());

  INSERT INTO public.patients (user_id, first_name, last_name, phone, created_at)
  VALUES (new.id, v_first_name, v_last_name, 'Update required', NOW());

  -- 2. Sync 'patient' role back to Supabase Auth Metadata for the middleware to read
  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'patient')
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();