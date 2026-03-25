
CREATE TABLE public.review_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  chef_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chefs can view own appeals" ON public.review_appeals
  FOR SELECT USING (auth.uid() = chef_id);

CREATE POLICY "Chefs can create appeals" ON public.review_appeals
  FOR INSERT WITH CHECK (auth.uid() = chef_id);

CREATE POLICY "Admins can view all appeals" ON public.review_appeals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appeals" ON public.review_appeals
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appeals" ON public.review_appeals
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
