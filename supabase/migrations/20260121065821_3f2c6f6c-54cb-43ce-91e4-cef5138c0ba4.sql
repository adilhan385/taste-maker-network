-- Enable realtime for orders table so buyers can track status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;