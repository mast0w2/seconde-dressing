-- supabase/schema.sql
-- Snapshot of the production schema (public tables, functions, RLS, grants,
-- storage buckets and policies), read from the production catalog on
-- 2026-09-24, then brought up to date with migrations 0019 to 0023
-- (seller approval, locked requests, server-only contracts, private storage,
-- shared rate limits).
--
-- WHY THIS FILE: supabase/migrations/ can no longer rebuild the database from
-- scratch. Several RLS policies were created outside the repo, and migrations
-- were applied by hand in an order that differs from their numbering. This
-- file is what a fresh environment is built from (it created the preprod
-- project). The migrations stay as the history of how production got here.
--
-- KEEPING IT CURRENT: every new migration applied to production must also be
-- reflected here, so that the next environment built from this file matches.
--
-- Run it on an EMPTY Supabase project only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
CREATE TYPE public.request_status AS ENUM (
    'pending', 'accepted', 'refused', 'items_collected', 'items_on_sale', 'completed'
);
-- Unused since `availabilities` was dropped (0013); kept to match production.
CREATE TYPE public.availability_status AS ENUM ('available', 'booked');
CREATE TYPE public.contact_message_status AS ENUM ('pending', 'read', 'resolved');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_name        text NOT NULL,
    first_name       text NOT NULL,
    email            text NOT NULL UNIQUE,
    phone            text,
    photo_url        text,
    street_address   text,
    role             text NOT NULL CHECK (role = ANY (ARRAY['client'::text, 'seller'::text])),
    seller_status    text CHECK (seller_status IN ('pending', 'approved', 'rejected')),
    seller_reviewed_at timestamptz,
    bio              text,
    specialization   text,
    hourly_rate      numeric(10,2),
    years_experience integer,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now(),
    CONSTRAINT profiles_seller_status_matches_role
        CHECK ((role = 'seller') = (seller_status IS NOT NULL))
);

-- Accounts allowed to approve sellers. No policy: written from the SQL editor.
CREATE TABLE public.admins (
    user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per rate-limited call; key is a SHA-256 hash computed by the app.
CREATE TABLE public.rate_limit_hits (
    key    text        NOT NULL,
    hit_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.formulas (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        text NOT NULL UNIQUE,
    label       text NOT NULL,
    price       numeric(10,2) NOT NULL,
    description text,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.requests (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
    request_type        text NOT NULL DEFAULT 'appointment'::text,
    message             text,
    status              public.request_status NOT NULL DEFAULT 'pending'::public.request_status,
    seller_id           uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    proposed_date       date,
    proposed_time       time,
    confirmed_date      date,
    confirmed_time      time,
    address             text,
    formula_id          uuid REFERENCES public.formulas (id) ON DELETE SET NULL,
    conditions_accepted boolean NOT NULL DEFAULT false,
    number_of_items     integer,
    average_value       numeric(10,2),
    brands              text,
    description         text,
    estimate            numeric(10,2),
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    client_first_name   text,
    client_last_name    text,
    client_email        text,
    client_phone        text
);

CREATE TABLE public.request_items (
    id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id             uuid NOT NULL REFERENCES public.requests (id) ON DELETE CASCADE,
    photo_url              text NOT NULL,
    description            text,
    created_at             timestamptz DEFAULT now(),
    min_price              numeric(10,2),
    min_price_validated_at timestamptz,
    sale_price             numeric(10,2),
    sale_proof_url         text,
    sold_at                timestamptz
);

CREATE TABLE public.request_refusals (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id uuid NOT NULL REFERENCES public.requests (id) ON DELETE CASCADE,
    seller_id  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (request_id, seller_id)
);

CREATE TABLE public.request_contracts (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id            uuid NOT NULL UNIQUE REFERENCES public.requests (id) ON DELETE CASCADE,
    client_id             uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    seller_id             uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    version               text NOT NULL,
    content               jsonb NOT NULL,
    client_signed_at      timestamptz,
    client_signature      text,
    client_signature_name text,
    seller_signed_at      timestamptz,
    seller_signature      text,
    seller_signature_name text,
    created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.reviews (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    seller_id  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.contact_messages (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       text NOT NULL,
    email      text NOT NULL,
    phone      text,
    subject    text NOT NULL,
    message    text NOT NULL,
    status     public.contact_message_status NOT NULL DEFAULT 'pending'::public.contact_message_status,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.request_contracts IS 'Contrat de dépôt-vente généré au passage en items_collected, signé par la cliente et la vendeuse.';
COMMENT ON COLUMN public.request_contracts.content IS 'Instantané JSON du contrat (parties, formule, répartition, pièces) figé à la génération.';
COMMENT ON COLUMN public.request_items.min_price IS 'Prix de vente minimal souhaité. Saisi par la cliente (formule Déjà trié) ou la vendeuse, validé par la cliente.';
COMMENT ON COLUMN public.request_items.min_price_validated_at IS 'Validation du prix minimal par la cliente : verrouille min_price.';
COMMENT ON COLUMN public.request_items.sale_price IS 'Prix de vente final effectivement encaissé, renseigné par la vendeuse seule.';
COMMENT ON COLUMN public.request_items.sale_proof_url IS 'Justificatif de vente (capture / reçu) déposé par la vendeuse.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_profiles_email      ON public.profiles (email);
CREATE INDEX idx_profiles_role       ON public.profiles (role);
CREATE INDEX idx_profiles_created_at ON public.profiles (created_at);
CREATE INDEX idx_requests_client_id  ON public.requests (client_id);
CREATE INDEX idx_requests_seller_id  ON public.requests (seller_id);
CREATE INDEX idx_requests_status     ON public.requests (status);
CREATE INDEX idx_requests_formula_id ON public.requests (formula_id);
CREATE INDEX idx_requests_created_at ON public.requests (created_at);
CREATE INDEX idx_requests_seller_client ON public.requests (seller_id, client_id);
CREATE INDEX idx_requests_client_seller ON public.requests (client_id, seller_id);
CREATE INDEX idx_request_items_request_id     ON public.request_items (request_id);
CREATE INDEX idx_request_refusals_request_id  ON public.request_refusals (request_id);
CREATE INDEX idx_request_refusals_seller_id   ON public.request_refusals (seller_id);
CREATE INDEX idx_request_contracts_request_id ON public.request_contracts (request_id);
CREATE INDEX idx_request_contracts_client_id  ON public.request_contracts (client_id);
CREATE INDEX idx_request_contracts_seller_id  ON public.request_contracts (seller_id);
CREATE INDEX idx_rate_limit_hits_key_hit_at   ON public.rate_limit_hits (key, hit_at);
CREATE INDEX idx_rate_limit_hits_hit_at       ON public.rate_limit_hits (hit_at);

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.requests_require_signed_contract()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IN ('items_collected', 'items_on_sale', 'completed')
       AND OLD.status IS DISTINCT FROM NEW.status
       AND OLD.status NOT IN ('items_collected', 'items_on_sale', 'completed') THEN
        IF NOT EXISTS (
            SELECT 1 FROM request_contracts c
            WHERE c.request_id = NEW.id
              AND c.client_signed_at IS NOT NULL
              AND c.seller_signed_at IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Le contrat de dépôt-vente doit être signé par la cliente et la vendeuse avant de passer en « Articles récupérés ».'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.request_items_pricing_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    uid        UUID := auth.uid();
    req_client UUID;
    req_seller UUID;
BEGIN
    IF uid IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT client_id, seller_id INTO req_client, req_seller
    FROM requests WHERE id = NEW.request_id;

    IF TG_OP = 'INSERT' THEN
        NEW.min_price_validated_at := NULL;
        IF uid IS DISTINCT FROM req_seller THEN
            NEW.sale_price := NULL;
            NEW.sale_proof_url := NULL;
            NEW.sold_at := NULL;
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.min_price_validated_at IS NOT NULL
       AND NEW.min_price IS DISTINCT FROM OLD.min_price THEN
        RAISE EXCEPTION 'Le prix minimal a été validé par la cliente : il ne peut plus être modifié.'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.min_price_validated_at IS DISTINCT FROM OLD.min_price_validated_at THEN
        IF OLD.min_price_validated_at IS NOT NULL THEN
            RAISE EXCEPTION 'La validation du prix minimal ne peut pas être annulée.'
                USING ERRCODE = 'check_violation';
        END IF;
        IF uid IS DISTINCT FROM req_client THEN
            RAISE EXCEPTION 'Seule la cliente peut valider le prix minimal.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF NEW.min_price IS NULL THEN
            RAISE EXCEPTION 'Impossible de valider un prix minimal vide.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    IF (NEW.sale_price IS DISTINCT FROM OLD.sale_price
        OR NEW.sale_proof_url IS DISTINCT FROM OLD.sale_proof_url
        OR NEW.sold_at IS DISTINCT FROM OLD.sold_at)
       AND uid IS DISTINCT FROM req_seller THEN
        RAISE EXCEPTION 'Seule la vendeuse peut renseigner la vente.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER requests_require_signed_contract BEFORE UPDATE OF status ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.requests_require_signed_contract();
CREATE TRIGGER request_items_pricing_guard BEFORE INSERT OR UPDATE ON public.request_items
    FOR EACH ROW EXECUTE FUNCTION public.request_items_pricing_guard();

CREATE FUNCTION public.attach_anonymous_requests()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    uid    UUID := auth.uid();
    uemail TEXT := lower(coalesce(auth.jwt() ->> 'email', ''));
    n      INTEGER;
BEGIN
    IF uid IS NULL OR uemail = '' THEN
        RETURN 0;
    END IF;

    WITH attached AS (
        UPDATE requests
           SET client_id = uid
         WHERE client_id IS NULL
           AND lower(client_email) = uemail
        RETURNING id
    )
    SELECT count(*) INTO n FROM attached;

    UPDATE request_contracts c
       SET client_id = uid
      FROM requests r
     WHERE c.request_id = r.id
       AND r.client_id = uid
       AND c.client_id IS NULL;

    RETURN n;
END;
$$;

CREATE FUNCTION public.account_password_state(account_email text)
RETURNS TABLE (account_exists boolean, has_password boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = auth, public, pg_temp AS $$
  SELECT
    true AS account_exists,
    COALESCE(u.raw_user_meta_data ->> 'password_set', 'true') <> 'false'
      AS has_password
  FROM auth.users u
  WHERE lower(u.email) = lower(account_email)
    AND u.deleted_at IS NULL
  ORDER BY u.created_at
  LIMIT 1;
$$;

CREATE FUNCTION public.accept_request(request_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
COMMENT ON FUNCTION public.accept_request(uuid) IS
    'Assigns an open request to the calling seller. SECURITY DEFINER because RLS gives sellers no read access to unassigned requests, which a plain UPDATE would need.';

CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid());
$$;

-- A signed-in user can neither change her role nor set her own seller_status;
-- a seller she creates always starts out pending (0019).
CREATE FUNCTION public.profiles_guard()
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

CREATE TRIGGER profiles_guard BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

-- A contract never changes once written, nor a signature once set (0021).
CREATE FUNCTION public.request_contracts_guard()
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

CREATE TRIGGER request_contracts_guard BEFORE UPDATE ON public.request_contracts
    FOR EACH ROW EXECUTE FUNCTION public.request_contracts_guard();

CREATE FUNCTION public.admin_list_sellers()
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
CREATE FUNCTION public.admin_set_seller_status(target_id UUID, new_status TEXT)
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

-- Shared rate limiting for the server routes (0023).
CREATE FUNCTION public.rate_limit_hit(
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

REVOKE ALL ON FUNCTION public.account_password_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_password_state(text) TO service_role;
REVOKE ALL ON FUNCTION public.attach_anonymous_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_request(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_list_sellers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_sellers() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_set_seller_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_seller_status(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- View: open requests for sellers, without contact details
-- ---------------------------------------------------------------------------
CREATE VIEW public.requests_ouvertes WITH (security_invoker = off) AS
SELECT r.id, r.created_at, r.updated_at, r.status, r.request_type, r.address,
       r.formula_id, r.number_of_items, r.average_value, r.brands,
       r.description, r.message, r.estimate, r.conditions_accepted, r.seller_id
  FROM public.requests r
 WHERE r.status = 'pending'
   AND r.seller_id IS NULL
   AND EXISTS (
       SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'seller' AND p.seller_status = 'approved'
   );

REVOKE ALL ON public.requests_ouvertes FROM anon;

-- ---------------------------------------------------------------------------
-- Table grants that differ from Supabase defaults
-- ---------------------------------------------------------------------------
-- requests: the public form writes through the service role; a signed-in
-- user may only change `status` (and updated_at), as the assigned seller (0020).
REVOKE ALL ON public.requests FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.requests FROM authenticated;
GRANT UPDATE (status, updated_at) ON public.requests TO authenticated;

-- request_contracts: read-only for users, written by the server (0021).
REVOKE ALL ON public.request_contracts FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.request_contracts FROM authenticated;

-- reviews: unused by the site since 0020 (reviews live in src/data/reviews.ts).
REVOKE ALL ON public.reviews FROM anon, authenticated;

REVOKE ALL ON public.admins FROM anon, authenticated;
REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;

REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_refusals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_hits   ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_own_or_related ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM requests r
         WHERE r.seller_id IS NOT NULL
           AND ((r.seller_id = auth.uid() AND r.client_id = profiles.id)
             OR (r.client_id = auth.uid() AND r.seller_id = profiles.id))));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY formulas_read_all ON public.formulas FOR SELECT TO public USING (true);

CREATE POLICY requests_read_own_as_client ON public.requests FOR SELECT TO authenticated
    USING (auth.uid() = client_id);
CREATE POLICY requests_read_own_as_seller ON public.requests FOR SELECT TO authenticated
    USING (auth.uid() = seller_id);
CREATE POLICY requests_insert_own_pending ON public.requests FOR INSERT TO authenticated
    WITH CHECK (client_id = auth.uid() AND seller_id IS NULL AND status = 'pending'
                AND confirmed_date IS NULL AND confirmed_time IS NULL);
CREATE POLICY requests_update_status_as_seller ON public.requests FOR UPDATE TO authenticated
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid() AND status <> 'pending');

CREATE POLICY request_items_read_involved ON public.request_items FOR SELECT TO authenticated
    USING (request_id IN (SELECT requests.id FROM requests
        WHERE requests.client_id = auth.uid() OR requests.seller_id = auth.uid()));
CREATE POLICY request_items_insert_involved ON public.request_items FOR INSERT TO authenticated
    WITH CHECK (request_id IN (SELECT requests.id FROM requests
        WHERE requests.client_id = auth.uid() OR requests.seller_id = auth.uid()));
CREATE POLICY request_items_update_involved ON public.request_items FOR UPDATE TO authenticated
    USING (request_id IN (SELECT requests.id FROM requests
        WHERE requests.client_id = auth.uid() OR requests.seller_id = auth.uid()))
    WITH CHECK (request_id IN (SELECT requests.id FROM requests
        WHERE requests.client_id = auth.uid() OR requests.seller_id = auth.uid()));

CREATE POLICY request_refusals_read_own ON public.request_refusals FOR SELECT TO authenticated
    USING (auth.uid() = seller_id);
CREATE POLICY request_refusals_read_as_client ON public.request_refusals FOR SELECT TO authenticated
    USING (request_id IN (SELECT requests.id FROM requests WHERE requests.client_id = auth.uid()));
CREATE POLICY request_refusals_insert_own ON public.request_refusals FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = seller_id);
CREATE POLICY request_refusals_update_own ON public.request_refusals FOR UPDATE TO authenticated
    USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY request_contracts_read_involved ON public.request_contracts FOR SELECT TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = seller_id);

CREATE POLICY contact_messages_insert_auth ON public.contact_messages FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
-- Same ids as production, so copied requests keep pointing at the right row.
INSERT INTO public.formulas (id, slug, label, price, description) VALUES
    ('9fba1a4d-5ba8-417a-9ba0-c1c7977562bc', 'pre-sorted',         'Déjà trié',      10.00, 'The customer has already sorted the items.'),
    ('6fac624c-9e23-4ca6-a119-34f69ac24b51', 'on-site-sorting',    'Tri sur place',  30.00, 'The seller sorts the items on site.'),
    ('49744a2b-7d1d-4f35-9c41-69d90930fdd1', 'sorting-and-advice', 'Tri et conseil', 50.00, 'The seller sorts the items and gives styling advice.');

-- ---------------------------------------------------------------------------
-- Storage buckets and policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('avatars',       'avatars',       true,  5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']),
    ('request-items', 'request-items', false, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']),
    ('sale-proofs',   'sale-proofs',   false, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']);

-- avatars: public URLs, but no listing; each user writes in her own folder.
CREATE POLICY "Users can read their own avatars" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());

-- request-items, sale-proofs: private, files under {request_id}/, readable by
-- the two parties of that request through signed URLs.
CREATE POLICY "Request parties can read request items" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'request-items' AND EXISTS (
        SELECT 1 FROM public.requests r
         WHERE r.id::text = (storage.foldername(name))[1]
           AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())));
CREATE POLICY "Request parties can upload request items" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'request-items' AND EXISTS (
        SELECT 1 FROM public.requests r
         WHERE r.id::text = (storage.foldername(name))[1]
           AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())));
CREATE POLICY "Authenticated users can delete their request items" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'request-items' AND owner = auth.uid());

CREATE POLICY "Request parties can read sale proofs" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'sale-proofs' AND EXISTS (
        SELECT 1 FROM public.requests r
         WHERE r.id::text = (storage.foldername(name))[1]
           AND (r.client_id = auth.uid() OR r.seller_id = auth.uid())));
CREATE POLICY "Assigned sellers can upload sale proofs" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'sale-proofs' AND EXISTS (
        SELECT 1 FROM public.requests r
         WHERE r.id::text = (storage.foldername(name))[1]
           AND r.seller_id = auth.uid()));
CREATE POLICY "Authenticated users can delete their sale proofs" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'sale-proofs' AND owner = auth.uid());
