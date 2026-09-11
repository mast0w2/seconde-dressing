-- 0005_request_refusals.sql
-- Per-seller request refusals.
--
-- A seller refusing a request must NOT change its global status, so another
-- seller can still accept it. Each refusal is recorded here: the refusing
-- seller stops seeing the request as "nouvelle" while it stays "pending" for
-- everyone else until someone accepts it.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS request_refusals (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id  UUID NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
    seller_id   UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (request_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_request_refusals_request_id
    ON request_refusals (request_id);
CREATE INDEX IF NOT EXISTS idx_request_refusals_seller_id
    ON request_refusals (seller_id);

COMMENT ON TABLE request_refusals IS
    'Records each request a seller refused, so the request stays open for other sellers while being hidden from the refusing seller.';
