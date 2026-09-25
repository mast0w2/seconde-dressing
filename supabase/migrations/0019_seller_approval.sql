-- 0019_seller_approval.sql
-- Sellers must be approved by an admin before they see or accept anything.
--
-- THE PROBLEM: the seller role was self-service. /api/auth/inscription
-- accepted role "seller" from anyone, and `profiles_update_own` let a client
-- flip her own `role` column. A seller reads, through `requests_ouvertes`, the
-- postal address, brands, average value and estimate of every open request,
-- and `accept_request` then hands her the client's name, email and phone. In
-- other words, anyone could learn where valuable clothes are and show up at
-- the door.
--
-- THE FIX:
--   * `profiles.seller_status`: 'pending' | 'approved' | 'rejected', NULL for
--     clients. Signing up as a seller still works, but lands on 'pending'.
--   * `profiles_guard` trigger: a signed-in user can neither change her role
--     nor set her own seller_status. Only trusted code can (service role, SQL
--     editor, the SECURITY DEFINER admin functions below).
--   * `requests_ouvertes` and `accept_request` require an APPROVED seller.
--   * `public.admins` lists the admins. Nothing reachable from the site can
--     write to it: an admin is added from the Supabase SQL editor.
--   * `admin_list_sellers()` / `admin_set_seller_status()` back the /admin page.
--
-- EXISTING SELLERS are marked 'approved' so nobody loses access on deploy.
-- Review them in /admin afterwards.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    user_id    UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admins IS
    'Accounts allowed to approve sellers. No policy on purpose: only the SQL editor or the service role writes here.';

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admins FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- Seller status
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS seller_status TEXT
        CHECK (seller_status IN ('pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS seller_reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.seller_status IS
    'Seller approval: pending until an admin approves or rejects. NULL for clients.';

UPDATE public.profiles
   SET seller_status = 'approved'
 WHERE role = 'seller'
   AND seller_status IS NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_seller_status_matches_role;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_seller_status_matches_role
    CHECK ((role = 'seller') = (seller_status IS NOT NULL));

-- ---------------------------------------------------------------------------
-- Guard: role and seller_status are not the user's to choose
-- ---------------------------------------------------------------------------
-- `current_user` tells trusted callers apart: PostgREST runs a signed-in
-- user's queries as `authenticated`, while the service role, the SQL editor
-- and SECURITY DEFINER functions run as their own, privileged roles.
CREATE OR REPLACE FUNCTION public.profiles_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    untrusted BOOLEAN := current_user IN ('authenticated', 'anon');
BEGIN
    IF TG_OP = 'UPDATE' AND untrusted THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Le rôle d''un compte ne peut pas être modifié.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF NEW.seller_status IS DISTINCT FROM OLD.seller_status
           OR NEW.seller_reviewed_at IS DISTINCT FROM OLD.seller_reviewed_at THEN
            RAISE EXCEPTION 'La validation d''une vendeuse est réservée aux administrateurs.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;

    -- A seller created by the user herself always starts out pending,
    -- whatever the insert carried.
    IF TG_OP = 'INSERT' AND untrusted THEN
        NEW.seller_status      := NULL;
        NEW.seller_reviewed_at := NULL;
    END IF;

    -- Keep seller_status consistent with the role for everyone, trusted
    -- callers included (e.g. an admin turning a client into a seller).
    IF NEW.role = 'seller' THEN
        NEW.seller_status := coalesce(NEW.seller_status, 'pending');
    ELSE
        NEW.seller_status      := NULL;
        NEW.seller_reviewed_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard ON public.profiles;
CREATE TRIGGER profiles_guard
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

-- ---------------------------------------------------------------------------
-- Open requests and acceptance: approved sellers only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.requests_ouvertes WITH (security_invoker = off) AS
SELECT r.id, r.created_at, r.updated_at, r.status, r.request_type, r.address,
       r.formula_id, r.number_of_items, r.average_value, r.brands,
       r.description, r.message, r.estimate, r.conditions_accepted, r.seller_id
  FROM public.requests r
 WHERE r.status = 'pending'
   AND r.seller_id IS NULL
   AND EXISTS (
       SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'seller'
          AND p.seller_status = 'approved'
   );

REVOKE ALL ON public.requests_ouvertes FROM anon;

CREATE OR REPLACE FUNCTION public.accept_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    uid     UUID := auth.uid();
    claimed INTEGER;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Authentification requise.' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM profiles p
         WHERE p.id = uid AND p.role = 'seller' AND p.seller_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Seule une vendeuse validée peut accepter une demande.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- The guards live in the WHERE clause, not in a prior read: that is what
    -- keeps the first seller to accept the winner under concurrency.
    UPDATE requests
       SET status         = 'accepted',
           seller_id      = uid,
           confirmed_date = current_date,
           confirmed_time = localtime,
           updated_at     = now()
     WHERE id        = request_id
       AND seller_id IS NULL
       AND status    = 'pending';

    GET DIAGNOSTICS claimed = ROW_COUNT;
    RETURN claimed = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_request(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_request(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin functions (the /admin page)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_sellers()
RETURNS TABLE (
    id                 UUID,
    first_name         TEXT,
    last_name          TEXT,
    email              TEXT,
    phone              TEXT,
    street_address     TEXT,
    bio                TEXT,
    seller_status      TEXT,
    created_at         TIMESTAMPTZ,
    seller_reviewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Réservé aux administrateurs.' USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.street_address,
           p.bio, p.seller_status, p.created_at, p.seller_reviewed_at
      FROM profiles p
     WHERE p.role = 'seller'
     ORDER BY (p.seller_status = 'pending') DESC, p.created_at DESC;
END;
$$;

-- Returns the seller's email and first name, so the caller can notify her.
-- No row when the id is not a seller.
CREATE OR REPLACE FUNCTION public.admin_set_seller_status(target_id UUID, new_status TEXT)
RETURNS TABLE (email TEXT, first_name TEXT, seller_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Réservé aux administrateurs.' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Statut inconnu : %', new_status USING ERRCODE = 'check_violation';
    END IF;

    RETURN QUERY
    WITH updated AS (
        UPDATE profiles p
           SET seller_status      = new_status,
               seller_reviewed_at = now()
         WHERE p.id = target_id
           AND p.role = 'seller'
        RETURNING p.email, p.first_name, p.seller_status
    )
    SELECT u.email, u.first_name, u.seller_status FROM updated u;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_sellers() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_seller_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_sellers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_seller_status(UUID, TEXT) TO authenticated;
