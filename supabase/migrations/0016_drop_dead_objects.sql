-- 0016_drop_dead_objects.sql
-- Removes two leftovers that no longer carry any behaviour.
--
-- 1. FUNCTION `update_updated_at_column()` — no trigger references it
--    (checked against pg_trigger, not the source tree), and it appears nowhere
--    in supabase/ or src/. It duplicates `update_updated_at()`, which carries
--    the only two real triggers (update_profiles_updated_at,
--    update_requests_updated_at). Left over from the pre-0001 French schema,
--    which 0001 never dropped.
--
-- 2. POLICY `formulas_read_for_everyone` — byte-for-byte equivalent to
--    `formulas_read_all`: same table, same SELECT, same `public` role, same
--    `USING (true)`. Two policies for one effect. `formulas_read_all` is kept,
--    so public read of the formulas is unchanged.
--
-- NOT TOUCHING THE `avatars` BUCKET: an earlier draft of this migration
-- dropped its four storage policies as unused. That was wrong. The bucket
-- backs the profile photo upload in ProfilePage.tsx, which writes
-- `{user.id}.{ext}` and stores the public URL in `profiles.photo_url`.
-- Dropping those policies would have broken avatar upload and display.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The duplicate timestamp function.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. The duplicate read policy on `formulas`.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS formulas_read_for_everyone ON formulas;
