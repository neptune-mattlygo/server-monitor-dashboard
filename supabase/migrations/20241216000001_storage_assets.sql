-- Create storage bucket for site assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the assets bucket
CREATE POLICY "Public assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

CREATE POLICY "Admins can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Admins can update assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assets');

CREATE POLICY "Admins can delete assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assets');
