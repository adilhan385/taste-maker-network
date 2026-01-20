-- Add RLS policy for users to view their own uploads in chef-documents bucket
CREATE POLICY "Users can upload own chef documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chef-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all chef documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'chef-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own chef documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'chef-documents' AND auth.uid()::text = (storage.foldername(name))[1]);