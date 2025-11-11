-- Create storage bucket for case files
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-files', 'case-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for case-files bucket
CREATE POLICY "Authenticated users can upload case files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own case files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own case files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);