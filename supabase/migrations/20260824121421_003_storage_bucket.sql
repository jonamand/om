/*
# Storage bucket for admin image uploads

1. Creates a public storage bucket `admin-images` for product/event/news cover images uploaded from the admin dashboard.
2. Allows authenticated users to upload (admin RLS already restricts who can create products/events/news).
3. Allows public read so site visitors can see the images.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-images', 'admin-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can upload admin images" ON storage.objects;
CREATE POLICY "Authenticated can upload admin images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-images');

DROP POLICY IF EXISTS "Public can read admin images" ON storage.objects;
CREATE POLICY "Public can read admin images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'admin-images');

DROP POLICY IF EXISTS "Authenticated can delete admin images" ON storage.objects;
CREATE POLICY "Authenticated can delete admin images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-images');
