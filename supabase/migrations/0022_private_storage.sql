-- 0022_private_storage.sql
-- Item photos and sale proofs become private; no bucket can be listed by the
-- public anymore; uploads are limited in path, type and size.
--
-- THE PROBLEM: the three buckets were public AND carried a SELECT policy for
-- `public`. The first part serves a file to whoever has its URL; the second
-- lets anyone LIST a bucket through the storage API. Anyone could therefore
-- enumerate and download every item photo and every sale proof, and collect
-- every user id from `avatars` (files were named {user.id}.{ext}). Uploads
-- were accepted anywhere in a bucket, of any type, up to the project-wide
-- size limit: free file hosting for whoever asked.
--
-- THE FIX:
--   * request-items, sale-proofs: private. Only the two parties of a request
--     can read its files, through signed URLs (src/lib/storage.ts). Files live
--     under {request_id}/…, which the policies check. Only the assigned seller
--     uploads sale proofs.
--   * avatars: stays public (profile photos are shown next to the other
--     party's name), but can no longer be listed. New uploads go under
--     {user.id}/…; the owner keeps SELECT on her own files, which the storage
--     API requires for upsert.
--   * Size and MIME type limits on all three buckets.
--
-- EXISTING ROWS keep working: request_items.photo_url and sale_proof_url still
-- hold full public URLs for older files, and the app extracts the path from
-- them before signing. Nothing to migrate.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
   SET public             = false,
       file_size_limit    = 10485760, -- 10 MB
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                  'image/heic', 'image/heif']
 WHERE id = 'request-items';

UPDATE storage.buckets
   SET public             = false,
       file_size_limit    = 10485760, -- 10 MB
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                  'image/heic', 'image/heif', 'application/pdf']
 WHERE id = 'sale-proofs';

UPDATE storage.buckets
   SET file_size_limit    = 5242880, -- 5 MB, as checked by ProfilePage
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                  'image/heic', 'image/heif']
 WHERE id = 'avatars';

-- ---------------------------------------------------------------------------
-- avatars
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can read their own avatars"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- "Authenticated users can update avatars" and "… delete avatars" (owner
-- only) are kept as they are.

-- ---------------------------------------------------------------------------
-- request-items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read request items" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload request items" ON storage.objects;
DROP POLICY IF EXISTS "Request parties can read request items" ON storage.objects;
DROP POLICY IF EXISTS "Request parties can upload request items" ON storage.objects;

CREATE POLICY "Request parties can read request items"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'request-items'
        AND EXISTS (
            SELECT 1 FROM public.requests r
             WHERE r.id::text = (storage.foldername(name))[1]
               AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())
        )
    );

CREATE POLICY "Request parties can upload request items"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'request-items'
        AND EXISTS (
            SELECT 1 FROM public.requests r
             WHERE r.id::text = (storage.foldername(name))[1]
               AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())
        )
    );

-- ---------------------------------------------------------------------------
-- sale-proofs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read sale proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload sale proofs" ON storage.objects;
DROP POLICY IF EXISTS "Request parties can read sale proofs" ON storage.objects;
DROP POLICY IF EXISTS "Assigned sellers can upload sale proofs" ON storage.objects;

CREATE POLICY "Request parties can read sale proofs"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'sale-proofs'
        AND EXISTS (
            SELECT 1 FROM public.requests r
             WHERE r.id::text = (storage.foldername(name))[1]
               AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())
        )
    );

CREATE POLICY "Assigned sellers can upload sale proofs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'sale-proofs'
        AND EXISTS (
            SELECT 1 FROM public.requests r
             WHERE r.id::text = (storage.foldername(name))[1]
               AND r.seller_id = auth.uid()
        )
    );
