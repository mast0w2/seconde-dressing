-- 0018_accept_request.sql
-- Makes "accept a request" work again. It has been silently failing since
-- 0011 enabled RLS on `requests`.
--
-- THE BUG: SellerDashboardPage ran the assignment as a plain UPDATE:
--
--   update requests set status='accepted', seller_id=<me>
--    where id=<x> and seller_id is null and status='pending'
--
-- PostgreSQL requires SELECT visibility on the rows an UPDATE's WHERE clause
-- filters, so the SELECT policies apply on top of the UPDATE ones. A seller
-- has exactly two: `auth.uid() = client_id` and `auth.uid() = seller_id`. On
-- an open request both columns are NULL, so neither matches, the UPDATE finds
-- nothing, and PostgREST answers 204 — success, zero rows. No error surfaced
-- anywhere: the button did nothing and the toast still said "Demande
-- acceptée". Verified on this database: the same UPDATE touches 0 rows as it
-- stands and 1 row as soon as a SELECT policy exposes the open request.
--
-- WHY NOT JUST ADD THAT SELECT POLICY: it would undo 0010. A seller could
-- then read every unassigned request straight from the table — client email,
-- phone and postal address included — which is precisely what the
-- `requests_ouvertes` view was introduced to prevent. RLS is row-level, so a
-- policy cannot expose the row while hiding the contact columns.
--
-- THE FIX: the same shape 0010 already uses for reading. `requests_ouvertes`
-- is a SECURITY DEFINER view that lets a seller see open requests without
-- granting table access; this is its write counterpart. The seller never
-- needs SELECT on the table, and the assignment stays a single atomic
-- statement, so two sellers accepting at once still resolve to one winner.
--
-- Returns true if the caller claimed the request, false if it was already
-- taken or is no longer open. Raises only when the caller is not a seller,
-- which the UI cannot produce.
-- Safe to re-run.

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

    IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = uid AND p.role = 'seller') THEN
        RAISE EXCEPTION 'Seule une vendeuse peut accepter une demande.'
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

-- Callable only by a signed-in user; the seller check above does the rest.
REVOKE ALL ON FUNCTION public.accept_request(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request(UUID) TO authenticated;

COMMENT ON FUNCTION public.accept_request(UUID) IS
    'Assigns an open request to the calling seller. SECURITY DEFINER because RLS gives sellers no read access to unassigned requests, which a plain UPDATE would need.';
