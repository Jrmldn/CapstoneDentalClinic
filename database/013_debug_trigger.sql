-- ============================================================
-- DEBUG TRIGGER: LOG TO PATIENTS TABLE
-- ============================================================

-- 1. Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the function with exception logger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_space_pos INT;
  v_role TEXT;
  v_existing_patient_id BIGINT;
BEGIN
  -- Extract metadata values sent during registration
  v_full_name := TRIM(new.raw_user_meta_data->>'full_name');
  v_first_name := TRIM(new.raw_user_meta_data->>'first_name');
  v_last_name := TRIM(new.raw_user_meta_data->>'last_name');
  v_phone := TRIM(new.raw_user_meta_data->>'phone');
  
  -- Default role is 'patient' unless specified (e.g. staff/dentist/superadmin)
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');

  -- Parse first and last names if not directly provided in metadata
  IF v_first_name IS NULL OR v_first_name = '' THEN
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
  END IF;

  IF v_last_name IS NULL OR v_last_name = '' THEN
    v_last_name := 'User';
  END IF;

  -- Ensure the phone number is populated.
  IF v_phone IS NULL OR v_phone = '' THEN
    v_phone := 'Update required - ' || new.id::text;
  END IF;

  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (new.id, new.email, v_role::user_role, NOW());

  -- 2. Create or merge patient record if role is patient
  IF v_role = 'patient' THEN
    
    -- Step A: Search by Email first (unclaimed profile, case-insensitive email match)
    SELECT id INTO v_existing_patient_id
    FROM public.patients
    WHERE user_id IS NULL
      AND email IS NOT NULL 
      AND TRIM(LOWER(email)) = TRIM(LOWER(new.email))
    ORDER BY created_at DESC
    LIMIT 1;

    -- Step B: Fallback to Phone number search if no email match was found
    IF v_existing_patient_id IS NULL THEN
      SELECT id INTO v_existing_patient_id
      FROM public.patients
      WHERE user_id IS NULL
        AND phone IS NOT NULL 
        AND TRIM(phone) = TRIM(v_phone)
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    -- Step C: Perform the Merge or Insert
    IF v_existing_patient_id IS NOT NULL THEN
      -- Merge: Link the existing patient record to the new auth user and save their email
      UPDATE public.patients
      SET user_id = new.id,
          email = new.email,
          first_name = CASE WHEN first_name = 'New' THEN v_first_name ELSE first_name END,
          last_name = CASE WHEN last_name = 'User' THEN v_last_name ELSE last_name END,
          updated_at = NOW()
      WHERE id = v_existing_patient_id;
    ELSE
      -- Insert: Create a brand new patient record and set the email
      INSERT INTO public.patients (user_id, first_name, last_name, phone, email, created_at)
      VALUES (new.id, v_first_name, v_last_name, v_phone, new.email, NOW());
    END IF;
  END IF;

  -- 3. Sync metadata
  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
  WHERE id = new.id;

  RETURN new;

EXCEPTION WHEN OTHERS THEN
  -- Log the error details into public.patients which has no user_id foreign key constraint
  INSERT INTO public.patients (first_name, last_name, phone, email)
  VALUES ('TRIGGER_ERR', SUBSTRING(SQLERRM || ' (STATE: ' || SQLSTATE || ')' FROM 1 FOR 255), '0000000000', 'trigger_error@gmail.com');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger to bind the function to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
