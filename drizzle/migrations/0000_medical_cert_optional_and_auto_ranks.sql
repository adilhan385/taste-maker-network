-- 1. Medical certificate becomes optional
ALTER TABLE public.chef_applications ALTER COLUMN docs_sanitary_url DROP NOT NULL;

-- 2. Flag on profiles so the catalog can show it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_medical_cert boolean NOT NULL DEFAULT false;

-- 3. Set the flag when an application is approved
CREATE OR REPLACE FUNCTION public.handle_chef_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'cook')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET has_medical_cert = (NEW.docs_sanitary_url IS NOT NULL AND NEW.docs_sanitary_url <> ''),
        updated_at = now()
    WHERE user_id = NEW.user_id;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.user_id, 'chef_application', 'Application Approved!',
      'Congratulations! Your chef application has been approved. You can now start adding dishes.', NEW.id);
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.user_id, 'chef_application', 'Application Rejected',
      'Unfortunately, your chef application was not approved. ' || COALESCE('Reason: ' || NEW.admin_notes, 'Please contact support for more information.'), NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Automatic ranks based on delivered orders (10 / 20 / 40)
CREATE OR REPLACE FUNCTION public.recalculate_chef_rank(_chef_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delivered_count integer;
  new_rank text;
BEGIN
  IF _chef_id IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO delivered_count
  FROM public.orders
  WHERE chef_id = _chef_id AND status = 'delivered';

  new_rank := CASE
    WHEN delivered_count >= 40 THEN 'diamond'
    WHEN delivered_count >= 20 THEN 'gold'
    WHEN delivered_count >= 10 THEN 'silver'
    ELSE 'bronze'
  END;

  INSERT INTO public.chef_ranks (chef_id, rank, updated_at)
  VALUES (_chef_id, new_rank, now())
  ON CONFLICT (chef_id) DO UPDATE
    SET rank = EXCLUDED.rank, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_order_delivered_rank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.recalculate_chef_rank(NEW.chef_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_delivered_rank ON public.orders;
CREATE TRIGGER trg_order_delivered_rank
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_delivered_rank();
