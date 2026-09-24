-- 0013_drop_unused_tables.sql
-- Drops `availabilities` and `preferences`, the only two tables in the schema
-- that nothing reads or writes any more.
--
-- Checked across the whole of src/:
--   * `availabilities` — created by 0001, never picked up since. No rows, no
--     reference, not even an entry in types/database.ts.
--   * `preferences` — created by 0001, written by a version of the code that
--     no longer exists. No reference today: no query, no trigger, no SQL
--     function. Both tables are now empty, so this migration destroys no data.
--
-- Neither table drags anything out with it: no foreign key points at them, and
-- the schema's only view (`requests_ouvertes`) does not mention them. Hence a
-- DROP without CASCADE — if a dependency appeared before this is applied, the
-- migration failing is better than it silently removing the dependent object.
-- The RLS policies (3 on `preferences`) go with the table.
--
-- `availabilities` was already dropped by hand on the remote project, so the
-- first statement is inert there while keeping this replayable on a fresh
-- database.
-- Safe to re-run.

DROP TABLE IF EXISTS public.availabilities;
DROP TABLE IF EXISTS public.preferences;
