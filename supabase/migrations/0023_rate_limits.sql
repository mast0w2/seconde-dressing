-- 0023_rate_limits.sql
-- Rate limiting shared by every server instance.
--
-- THE PROBLEM: the routes that send emails or reveal whether an account
-- exists counted calls in process memory. On Vercel every serverless instance
-- has its own memory, and instances come and go: the limits barely held. The
-- public forms (/api/contact, /api/appointment-request, /api/reviews/avis)
-- had no limit at all, and each call sends an email to an address of the
-- caller's choosing.
--
-- THE FIX: a sliding-window log in the database. `rate_limit_hit(key, max,
-- window)` records one hit and says whether it is allowed. Keys are hashed by
-- the app (src/lib/rate-limit.ts) before they get here, so no email or IP
-- address is stored. Rows older than a day are purged on the way.
--
-- Only the service role may call it: the app always goes through a server
-- route.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
    key    TEXT        NOT NULL,
    hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_key_hit_at ON public.rate_limit_hits (key, hit_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_hit_at ON public.rate_limit_hits (hit_at);

COMMENT ON TABLE public.rate_limit_hits IS
    'One row per rate-limited call. key is a SHA-256 hash computed by the app.';

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(
    bucket_key     TEXT,
    max_hits       INTEGER,
    window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    recent INTEGER;
BEGIN
    -- Serialises concurrent calls on the same key, so two simultaneous
    -- requests cannot both slip under the limit.
    PERFORM pg_advisory_xact_lock(hashtext(bucket_key));

    DELETE FROM rate_limit_hits WHERE hit_at < now() - interval '1 day';

    SELECT count(*) INTO recent
      FROM rate_limit_hits
     WHERE key = bucket_key
       AND hit_at > now() - make_interval(secs => window_seconds);

    IF recent >= max_hits THEN
        RETURN false;
    END IF;

    INSERT INTO rate_limit_hits (key) VALUES (bucket_key);
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) TO service_role;
