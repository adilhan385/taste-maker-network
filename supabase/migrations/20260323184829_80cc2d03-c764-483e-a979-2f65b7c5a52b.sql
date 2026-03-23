ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kaspi_phone text;

INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'payment-receipts');