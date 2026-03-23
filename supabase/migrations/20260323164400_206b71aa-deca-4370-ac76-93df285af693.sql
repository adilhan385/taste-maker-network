ALTER TABLE public.chef_applications ADD COLUMN IF NOT EXISTS kaspi_phone text;

-- Allow authenticated users to update product portions during purchase
CREATE POLICY "Authenticated can update product portions"
ON public.products FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert notifications (for order notifications)
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);