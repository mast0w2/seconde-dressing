-- 0014_account_password_state_metadata.sql
-- Fixes account_password_state, which answered "has a password" for everyone.
--
-- WHAT 0012 GOT WRONG: it read `auth.users.encrypted_password` and treated a
-- non-empty value as proof of a password. GoTrue never leaves that column
-- empty. A user created by `admin.createUser()` with no password still gets a
-- 60-character bcrypt hash -- of a random value, not of the empty string, so
-- no comparison against '' can tell the two apart either. Checked on this
-- database: all 21 accounts carry a `$2a$` hash, and none of them matches
-- crypt('', encrypted_password). The column is simply not a signal.
--
-- WHAT THIS DOES INSTEAD: the application states it explicitly. Every path
-- that creates an account now writes `password_set` into the user metadata --
-- false from the appointment request form, true from the signup form -- and
-- /reset-password flips it to true once a password is actually chosen.
--
-- A caveat worth knowing: user metadata is writable by the account holder
-- through `updateUser({ data })`. Someone could flip their own flag. The only
-- consequence is on their own login screen -- being asked for a password they
-- do not have, or being emailed a setup link they did not want. No access is
-- gained either way, so the simplicity is worth it. The read below never
-- casts the value, so a garbage flag cannot make the function raise.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Backfill the accounts that predate the flag.
-- ---------------------------------------------------------------------------
-- The appointment request form is the only path that ever created an account
-- without a password, and it is the only one that writes `street_address`
-- into the metadata (see /api/auth/espace and lib/auth/espace-link.ts). On
-- this database that separates 4 accounts from the other 17 cleanly, and the
-- 4 are exactly the ones whose metadata carries role=client from that form.
UPDATE auth.users
SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
           'password_set',
           NOT (COALESCE(raw_user_meta_data, '{}'::jsonb) ? 'street_address')
         )
WHERE deleted_at IS NULL
  AND NOT (COALESCE(raw_user_meta_data, '{}'::jsonb) ? 'password_set');

-- ---------------------------------------------------------------------------
-- 2. Read the flag instead of the password column.
-- ---------------------------------------------------------------------------
-- Same name and signature as 0012, so /api/auth/account-state is unchanged.
CREATE OR REPLACE FUNCTION public.account_password_state(account_email text)
RETURNS TABLE (account_exists boolean, has_password boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
  SELECT
    true AS account_exists,
    -- Anything that is not exactly the string 'false' counts as having a
    -- password: a missing flag means an account created outside our own
    -- routes (the Supabase dashboard, a manual insert), which does have one.
    -- Erring the other way would tell a real user their account is not
    -- created and mail them a setup link they never asked for.
    COALESCE(u.raw_user_meta_data ->> 'password_set', 'true') <> 'false'
      AS has_password
  FROM auth.users u
  WHERE lower(u.email) = lower(account_email)
    AND u.deleted_at IS NULL
  ORDER BY u.created_at
  LIMIT 1;
$$;

-- No row returned means no account: the caller infers `account_exists = false`.

REVOKE ALL ON FUNCTION public.account_password_state(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.account_password_state(text) FROM anon;
REVOKE ALL ON FUNCTION public.account_password_state(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.account_password_state(text) TO service_role;
