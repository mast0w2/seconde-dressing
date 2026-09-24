-- 0017_restore_avatars_policies.sql
-- Restores the four `avatars` storage policies that an earlier version of
-- 0016 dropped by mistake.
--
-- WHAT WENT WRONG: 0016 was written on the conclusion that the `avatars`
-- bucket was unused. That conclusion came from a search for `storage.from(`
-- on a single line, and the call in ProfilePage.tsx is split across two --
-- `supabase.storage` then `.from("avatars")`. The bucket is in fact the one
-- backing profile photos: upload writes `{user.id}.{ext}` with upsert, and the
-- public URL is stored in `profiles.photo_url`.
--
-- IMPACT WHILE THE POLICIES WERE MISSING: uploading or replacing a profile
-- photo failed, because the storage API enforces RLS on storage.objects for
-- INSERT and UPDATE. Reading was unaffected — the bucket is public, so the
-- `/object/public/` endpoint serves existing avatars without consulting RLS.
-- No data was lost; the two stored files were never touched.
--
-- The definitions below are copied verbatim from 0001.
-- Safe to re-run.

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Public read access for avatar URLs (bucket is public)
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
