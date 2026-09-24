-- supabase/schema.sql
-- Snapshot of the production schema (public tables, functions, RLS, grants,
-- storage buckets and policies), read from the production catalog on
-- 2026-09-24.
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
    bio              text,
    specialization   text,
    hourly_rate      numeric(10,2),
    years_experience integer,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
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

    IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = uid AND p.role = 'seller') THEN
        RAISE EXCEPTION 'Seule une vendeuse peut accepter une demande.'
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

REVOKE ALL ON FUNCTION public.account_password_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_password_state(text) TO service_role;
REVOKE ALL ON FUNCTION public.attach_anonymous_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_request(uuid) FROM PUBLIC;

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
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'seller');

REVOKE ALL ON public.requests_ouvertes FROM anon;

-- ---------------------------------------------------------------------------
-- Table grants that differ from Supabase defaults
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.requests FROM anon;
GRANT INSERT ON public.requests TO anon;
GRANT SELECT (id) ON public.requests TO anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.requests FROM authenticated;

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
CREATE POLICY requests_insert ON public.requests FOR INSERT TO public
    WITH CHECK (auth.uid() = client_id OR client_id IS NULL);
CREATE POLICY requests_update_as_client ON public.requests FOR UPDATE TO authenticated
    USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY requests_update_as_seller ON public.requests FOR UPDATE TO authenticated
    USING (auth.uid() = seller_id OR status = 'pending'::request_status)
    WITH CHECK (auth.uid() = seller_id OR status = 'pending'::request_status);

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
CREATE POLICY request_contracts_insert_seller ON public.request_contracts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = seller_id);
CREATE POLICY request_contracts_update_involved ON public.request_contracts FOR UPDATE TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = client_id OR auth.uid() = seller_id);

CREATE POLICY reviews_read_all ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = client_id OR auth.uid() = seller_id);
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = client_id OR auth.uid() = seller_id);

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
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
    ('avatars',       'avatars',       true, 20971520),
    ('request-items', 'request-items', true, NULL),
    ('sale-proofs',   'sale-proofs',   true, NULL);

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Public can read avatars" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload request items" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'request-items');
CREATE POLICY "Public can read request items" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'request-items');
CREATE POLICY "Authenticated users can delete their request items" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'request-items' AND owner = auth.uid());

CREATE POLICY "Authenticated users can upload sale proofs" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'sale-proofs');
CREATE POLICY "Public can read sale proofs" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'sale-proofs');
CREATE POLICY "Authenticated users can delete their sale proofs" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'sale-proofs' AND owner = auth.uid());
