-- 0012_account_password_state.sql
-- Lets the login page find out, before asking for anything, whether an address
-- has an account and whether that account has a password.
--
-- WHY: a space created from the appointment request form exists in
-- `auth.users` with no password — its owner signs in through an emailed link.
-- Until now the login page could not tell the two apart: it asked everyone for
-- a password, and `signInWithPassword` answered the same error for an unknown
-- address and for a space that never had a password.
--
-- GoTrue's admin API says nothing about the password: only the
-- `auth.users.encrypted_password` column knows. PostgREST cannot read the
-- `auth` schema, hence this SECURITY DEFINER function.
--
-- Only `service_role` may execute it, so it is reachable from a server route
-- alone: it does not become an address-enumeration oracle for anyone holding
-- the anon key that ships in the site's JS bundle.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.account_password_state(account_email text)
RETURNS TABLE (account_exists boolean, has_password boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
  SELECT
    true AS account_exists,
    -- GoTrue leaves this column empty (not NULL) for an account created
    -- without a password: cover both conventions.
    COALESCE(u.encrypted_password, '') <> '' AS has_password
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
