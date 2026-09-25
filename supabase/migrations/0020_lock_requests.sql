-- 0020_lock_requests.sql
-- Stops users from forging the client/seller link on `requests`, and closes
-- the public `reviews` table.
--
-- THE PROBLEM: `profiles_read_own_or_related` opens a profile to whoever
-- shares a request with it. Nothing stopped a user from manufacturing that
-- request:
--   * `requests_insert` only checked client_id, so a signed-in user could
--     insert {client_id: me, seller_id: <anyone>} and then read that
--     person's name, email, phone and address;
--   * `requests_update_as_client` let a client rewrite any column of her
--     request, seller_id included, and `requests_update_as_seller` let a
--     seller rewrite client_id;
--   * anon could insert requests already assigned to any seller, with any
--     status, straight through PostgREST.
-- UUIDs were easy to collect: `reviews` was readable by anyone, client_id and
-- seller_id included.
--
-- THE FIX:
--   * Insert: signed-in clients only, for themselves, unassigned and pending.
--     The public form goes through /api/appointment-request, which writes with
--     the service role; anon no longer touches the table.
--   * Update: the assigned seller only, and only `status` (plus updated_at).
--     No client-side code updates a request; assignment goes through
--     accept_request() (SECURITY DEFINER).
--   * `reviews`: nothing on the site reads or writes it anymore (published
--     reviews live in src/data/reviews.ts, new ones arrive by email), so it is
--     closed to anon and authenticated.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS requests_insert ON public.requests;
DROP POLICY IF EXISTS requests_insert_own_pending ON public.requests;
DROP POLICY IF EXISTS requests_update_as_client ON public.requests;
DROP POLICY IF EXISTS requests_update_as_seller ON public.requests;
DROP POLICY IF EXISTS requests_update_status_as_seller ON public.requests;

REVOKE ALL ON public.requests FROM anon;

CREATE POLICY requests_insert_own_pending ON public.requests
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = auth.uid()
        AND seller_id IS NULL
        AND status = 'pending'
        AND confirmed_date IS NULL
        AND confirmed_time IS NULL
    );

CREATE POLICY requests_update_status_as_seller ON public.requests
    FOR UPDATE TO authenticated
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid() AND status <> 'pending');

-- Column privileges do what a policy cannot: restrict WHICH columns change.
REVOKE UPDATE ON public.requests FROM authenticated;
GRANT UPDATE (status, updated_at) ON public.requests TO authenticated;

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS reviews_read_all ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;

REVOKE ALL ON public.reviews FROM anon, authenticated;
