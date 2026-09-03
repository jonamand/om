-- Storage bucket for digital product files (videos, PDFs, 3D models, packs)
-- Separate from admin-images (covers/thumbnails) to allow larger files and different lifecycle.

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-files', 'admin-files', true)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload digital files (admin RLS on products already restricts who creates products)
DROP POLICY IF EXISTS "Authenticated can upload admin files" ON storage.objects;
CREATE POLICY "Authenticated can upload admin files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-files');

-- Public read so buyers can stream/download after purchase
DROP POLICY IF EXISTS "Public can read admin files" ON storage.objects;
CREATE POLICY "Public can read admin files"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'admin-files');

-- Authenticated can delete (replace/remove files)
DROP POLICY IF EXISTS "Authenticated can delete admin files" ON storage.objects;
CREATE POLICY "Authenticated can delete admin files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-files');
