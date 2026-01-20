-- Drop existing triggers if any
DROP TRIGGER IF EXISTS on_chef_application_created ON public.chef_applications;
DROP TRIGGER IF EXISTS on_chef_application_status_changed ON public.chef_applications;

-- Create trigger for notifying admins on new chef application
CREATE TRIGGER on_chef_application_created
  AFTER INSERT ON public.chef_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_chef_application();

-- Create trigger for handling chef application status changes
CREATE TRIGGER on_chef_application_status_changed
  AFTER UPDATE OF status ON public.chef_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_chef_application_status_change();