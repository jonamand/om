/*
# Avatars storage bucket for profile pictures
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own avatar
CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars are publicly readable
CREATE POLICY "avatar_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
