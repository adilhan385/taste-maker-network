
CREATE OR REPLACE FUNCTION public.protect_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  owner_email text := 'adilhananuar426@gmail.com';
  target_email text;
BEGIN
  SELECT email INTO target_email FROM auth.users WHERE id = OLD.user_id;
  IF target_email = owner_email AND OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Cannot remove admin role from platform owner';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_owner_admin_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_owner_admin();
