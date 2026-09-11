-- 0004_request_items.sql
-- Clothing items photographed for a request: one row per uploaded photo,
-- with an optional description (typed or dictated). Safe to re-run.

CREATE TABLE IF NOT EXISTS request_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id  UUID NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
    photo_url   TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items (request_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('request-items', 'request-items', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload request items" ON storage.objects;
CREATE POLICY "Authenticated users can upload request items"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'request-items');

DROP POLICY IF EXISTS "Public can read request items" ON storage.objects;
CREATE POLICY "Public can read request items"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'request-items');

DROP POLICY IF EXISTS "Authenticated users can delete their request items" ON storage.objects;
CREATE POLICY "Authenticated users can delete their request items"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'request-items' AND owner = auth.uid());
