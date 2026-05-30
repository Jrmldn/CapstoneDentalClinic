CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_space_pos INT;
  v_role TEXT; -- NEW: Variable to hold the role
BEGIN
  v_full_name := TRIM(new.raw_user_meta_data->>'full_name');
  -- Check if a role was passed during creation; if not, default to 'patient'
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');

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
    v_last_name := 'User';
  END IF;

  -- 1. Insert into public.users with the correct role
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (new.id, new.email, v_role::user_role, NOW());

  -- 2. ONLY create a patient record if the role is actually 'patient'
  IF v_role = 'patient' THEN
    INSERT INTO public.patients (user_id, first_name, last_name, phone, created_at)
    VALUES (new.id, v_first_name, v_last_name, 'Update required', NOW());
  END IF;

  -- 3. Sync the role back to Supabase Auth Metadata
  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;