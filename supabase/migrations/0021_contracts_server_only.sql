-- 0021_contracts_server_only.sql
-- Contracts are written by the server only, and frozen once written.
--
-- THE PROBLEM: `request_contracts_update_involved` let either party rewrite
-- every column. The seller could fill in client_signed_at / client_signature
-- herself, then move the request to « Articles récupérés » (the
-- requests_require_signed_contract trigger only checks that both dates are
-- set), and either party could rewrite `content` after signing. The
-- /api/contracts/[id]/sign route was correct, but PostgREST bypassed it with
-- the same JWT. `request_contracts_insert_seller` also let any seller create
-- the contract of a request that was not hers; request_id being UNIQUE, the
-- real contract could then never be created.
--
-- THE FIX:
--   * Signed-in users keep read access to their own contracts, nothing more.
--     /api/contracts (creation) and /api/contracts/[id]/sign check the caller
--     with her own session, then write with the service role.
--   * `request_contracts_guard` freezes a contract for everyone, service role
--     included: content, version, request and seller never change, and a
--     signature, once set, stays as it is. client_id may still go from NULL
--     to the client (attach_anonymous_requests) or back to NULL (ON DELETE
--     SET NULL), as may seller_id.
--
-- Safe to re-run.

DROP POLICY IF EXISTS request_contracts_insert_seller ON public.request_contracts;
DROP POLICY IF EXISTS request_contracts_update_involved ON public.request_contracts;

REVOKE ALL ON public.request_contracts FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.request_contracts FROM authenticated;

CREATE OR REPLACE FUNCTION public.request_contracts_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.request_id IS DISTINCT FROM OLD.request_id
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Un contrat généré ne peut plus être modifié.'
            USING ERRCODE = 'check_violation';
    END IF;

    -- The parties may only be attached (NULL -> id) or detached (id -> NULL).
    IF OLD.client_id IS NOT NULL AND NEW.client_id IS NOT NULL
       AND NEW.client_id <> OLD.client_id THEN
        RAISE EXCEPTION 'La cliente d''un contrat ne peut pas être changée.'
            USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.seller_id IS NOT NULL AND NEW.seller_id IS NOT NULL
       AND NEW.seller_id <> OLD.seller_id THEN
        RAISE EXCEPTION 'La vendeuse d''un contrat ne peut pas être changée.'
            USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.seller_id IS NULL AND NEW.seller_id IS NOT NULL THEN
        RAISE EXCEPTION 'La vendeuse d''un contrat ne peut pas être changée.'
            USING ERRCODE = 'check_violation';
    END IF;

    IF OLD.client_signed_at IS NOT NULL
       AND (NEW.client_signed_at, NEW.client_signature, NEW.client_signature_name)
           IS DISTINCT FROM (OLD.client_signed_at, OLD.client_signature, OLD.client_signature_name) THEN
        RAISE EXCEPTION 'Une signature posée ne peut pas être modifiée.'
            USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.seller_signed_at IS NOT NULL
       AND (NEW.seller_signed_at, NEW.seller_signature, NEW.seller_signature_name)
           IS DISTINCT FROM (OLD.seller_signed_at, OLD.seller_signature, OLD.seller_signature_name) THEN
        RAISE EXCEPTION 'Une signature posée ne peut pas être modifiée.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS request_contracts_guard ON public.request_contracts;
CREATE TRIGGER request_contracts_guard
    BEFORE UPDATE ON public.request_contracts
    FOR EACH ROW EXECUTE FUNCTION public.request_contracts_guard();
