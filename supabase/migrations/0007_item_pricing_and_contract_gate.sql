-- 0007_item_pricing_and_contract_gate.sql
--
-- 1. Le contrat de dépôt-vente doit être signé par la cliente ET la vendeuse
--    avant qu'une demande passe en « Articles récupérés » (ou au-delà).
-- 2. Prix par pièce sur request_items :
--    - min_price : prix de vente minimal, saisi par la cliente ou la vendeuse
--      (selon la formule), puis VALIDÉ par la cliente. Une fois validé, il est
--      verrouillé pour tout le monde.
--    - sale_price / sale_proof_url / sold_at : vente réelle, renseignée par la
--      vendeuse seule, avec un justificatif (bucket `sale-proofs`).
-- Les règles sont appliquées par des triggers (auth.uid()) pour tenir aussi
-- bien via l'API que via le client Supabase direct. Safe to re-run.

-- ------------------------------------------------------------
-- 1. Garde-fou : contrat signé avant « Articles récupérés »
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION requests_require_signed_contract()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requests_require_signed_contract ON requests;
CREATE TRIGGER requests_require_signed_contract
    BEFORE UPDATE OF status ON requests
    FOR EACH ROW EXECUTE FUNCTION requests_require_signed_contract();

-- ------------------------------------------------------------
-- 2. Prix par pièce
-- ------------------------------------------------------------
ALTER TABLE request_items
    ADD COLUMN IF NOT EXISTS min_price               NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS min_price_validated_at  TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sale_price              NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS sale_proof_url          TEXT,
    ADD COLUMN IF NOT EXISTS sold_at                 TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN request_items.min_price IS
    'Prix de vente minimal souhaité. Saisi par la cliente (formule Déjà trié) ou la vendeuse, validé par la cliente.';
COMMENT ON COLUMN request_items.min_price_validated_at IS
    'Validation du prix minimal par la cliente : verrouille min_price.';
COMMENT ON COLUMN request_items.sale_price IS
    'Prix de vente final effectivement encaissé, renseigné par la vendeuse seule.';
COMMENT ON COLUMN request_items.sale_proof_url IS
    'Justificatif de vente (capture / reçu) déposé par la vendeuse.';

-- Règles d'écriture sur les prix. SECURITY DEFINER pour lire `requests`
-- quelle que soit la politique RLS ; auth.uid() reste celui de l'appelant.
CREATE OR REPLACE FUNCTION request_items_pricing_guard()
RETURNS TRIGGER AS $$
DECLARE
    uid        UUID := auth.uid();
    req_client UUID;
    req_seller UUID;
BEGIN
    -- Service role / migrations : pas d'utilisateur, on laisse passer.
    IF uid IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT client_id, seller_id INTO req_client, req_seller
    FROM requests WHERE id = NEW.request_id;

    IF TG_OP = 'INSERT' THEN
        -- La validation est une action séparée ; la vente n'est que vendeuse.
        NEW.min_price_validated_at := NULL;
        IF uid IS DISTINCT FROM req_seller THEN
            NEW.sale_price := NULL;
            NEW.sale_proof_url := NULL;
            NEW.sold_at := NULL;
        END IF;
        RETURN NEW;
    END IF;

    -- Prix minimal verrouillé une fois validé par la cliente.
    IF OLD.min_price_validated_at IS NOT NULL
       AND NEW.min_price IS DISTINCT FROM OLD.min_price THEN
        RAISE EXCEPTION 'Le prix minimal a été validé par la cliente : il ne peut plus être modifié.'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Validation : cliente uniquement, irréversible, prix requis.
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

    -- Vente : vendeuse uniquement.
    IF (NEW.sale_price IS DISTINCT FROM OLD.sale_price
        OR NEW.sale_proof_url IS DISTINCT FROM OLD.sale_proof_url
        OR NEW.sold_at IS DISTINCT FROM OLD.sold_at)
       AND uid IS DISTINCT FROM req_seller THEN
        RAISE EXCEPTION 'Seule la vendeuse peut renseigner la vente.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_items_pricing_guard ON request_items;
CREATE TRIGGER request_items_pricing_guard
    BEFORE INSERT OR UPDATE ON request_items
    FOR EACH ROW EXECUTE FUNCTION request_items_pricing_guard();

-- ------------------------------------------------------------
-- Storage : justificatifs de vente (même modèle que request-items)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-proofs', 'sale-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload sale proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload sale proofs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'sale-proofs');

DROP POLICY IF EXISTS "Public can read sale proofs" ON storage.objects;
CREATE POLICY "Public can read sale proofs"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'sale-proofs');

DROP POLICY IF EXISTS "Authenticated users can delete their sale proofs" ON storage.objects;
CREATE POLICY "Authenticated users can delete their sale proofs"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'sale-proofs' AND owner = auth.uid());
