-- Fix the handle_new_user trigger to properly handle user_type
-- and use ON CONFLICT for idempotency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_type_val text;
BEGIN
  user_type_val := COALESCE(
    new.raw_user_meta_data->>'user_type',
    'homeowner'
  );

  INSERT INTO public.profiles (id, full_name, avatar_url, user_type)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    user_type_val
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type;

  RETURN new;
END;
$$;
