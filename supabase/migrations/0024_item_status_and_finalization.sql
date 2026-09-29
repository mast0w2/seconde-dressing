-- 0024_item_status_and_finalization.sql
--
-- Inventaire en tableau : statut par pièce, marque, prix de départ, notes,
-- et finalisation irréversible.
--
-- CE QUI CHANGE
--   1. `item_status` : cinq états explicites par pièce. Jusqu'ici une pièce
--      était « vendue ou pas » (sold_at), ce qui ne disait ni si l'annonce
--      était en ligne, ni si la cliente avait été payée.
--   2. `brand` et `starting_price` : la marque sort du texte libre (elle
--      devient triable), et le prix affiché en ligne cesse d'être confondu
--      avec le prix plancher.
--   3. `notes` : commentaire libre sur une pièce. Obligatoire pour la passer
--      en « invendable » — sinon personne ne saura pourquoi.
--   4. `finalized_at` + verrou : une pièce finalisée est de l'argent déjà viré
--      à la cliente. Elle ne se modifie plus, ni ne se supprime.
--
-- RÈGLES SUR LES PRIX (elles complètent 0007, elles ne le remplacent pas)
--   * min_price      : plancher. Verrouillé dès la validation par la cliente.
--   * starting_price : prix affiché. La vendeuse le fixe, la cliente le valide
--     en même temps que le prix minimal. Après validation il reste baissable
--     par la vendeuse, mais jamais en dessous de min_price : c'est exactement
--     ce que la cliente a accepté. Le remonter demanderait un nouvel accord.
--
-- Tout est appliqué par triggers, donc aussi bien via l'API que via le client
-- Supabase appelé depuis le navigateur. Rejouable sans risque.

-- ---------------------------------------------------------------------------
-- 1. Statut par pièce
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM (
            'photos_taken',  -- inventoriée et photographiée
            'on_sale',       -- annonce en ligne
            'sold',          -- l'acheteur a payé la plateforme
            'finalized',     -- la cliente a été virée : ligne verrouillée
            'unsellable'     -- ne partira pas (raison obligatoire dans notes)
        );
    END IF;
END $$;

ALTER TABLE request_items
    ADD COLUMN IF NOT EXISTS status         item_status NOT NULL DEFAULT 'photos_taken',
    ADD COLUMN IF NOT EXISTS brand          TEXT,
    ADD COLUMN IF NOT EXISTS starting_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS finalized_at   TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS notes          TEXT;

COMMENT ON COLUMN request_items.status IS
    'État de la pièce. Seul « finalized » est irréversible : il signifie que la cliente a été payée.';
COMMENT ON COLUMN request_items.brand IS
    'Marque, extraite de la description pour devenir triable et filtrable.';
COMMENT ON COLUMN request_items.starting_price IS
    'Prix affiché en ligne. Fixé par la vendeuse, validé par la cliente avec le prix minimal, puis baissable jusqu''à min_price.';
COMMENT ON COLUMN request_items.finalized_at IS
    'Horodatage du virement à la cliente. Non nul = ligne verrouillée.';
COMMENT ON COLUMN request_items.notes IS
    'Commentaire libre sur la pièce. Obligatoire quand status = ''unsellable''.';

-- La photo n'est plus obligatoire : une pièce peut être saisie avant d'être
-- photographiée, notamment quand la cliente a déjà fait son propre inventaire.
ALTER TABLE request_items ALTER COLUMN photo_url DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Reprise de l'existant
--    Ce qui est déjà vendu le reste. Rien ne part en « finalized » : c'est à
--    la vendeuse de confirmer, preuve à l'appui, les virements déjà faits.
-- ---------------------------------------------------------------------------
UPDATE request_items
   SET status = 'sold'
 WHERE sold_at IS NOT NULL
   AND status = 'photos_taken';

-- ---------------------------------------------------------------------------
-- 3. Règles d'écriture
--    Remplace la fonction de 0007 en gardant tout ce qu'elle faisait.
--    SECURITY DEFINER pour lire `requests` quelle que soit la RLS ;
--    auth.uid() reste celui de l'appelant.
-- ---------------------------------------------------------------------------
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

    -- .....................................................................
    -- INSERT
    -- .....................................................................
    IF TG_OP = 'INSERT' THEN
        -- La validation est une action séparée ; la vente n'est que vendeuse.
        NEW.min_price_validated_at := NULL;
        IF uid IS DISTINCT FROM req_seller THEN
            NEW.sale_price     := NULL;
            NEW.sale_proof_url := NULL;
            NEW.sold_at        := NULL;
        END IF;
        -- Une pièce naît toujours au début du parcours.
        IF NEW.status IN ('finalized', 'sold') THEN
            NEW.status := 'photos_taken';
        END IF;
        NEW.finalized_at := NULL;
        RETURN NEW;
    END IF;

    -- .....................................................................
    -- Ligne finalisée : plus rien ne bouge, pour personne.
    -- .....................................................................
    IF OLD.status = 'finalized' THEN
        RAISE EXCEPTION 'Cette pièce est finalisée : la cliente a déjà été payée, elle ne peut plus être modifiée.'
            USING ERRCODE = 'check_violation';
    END IF;

    -- .....................................................................
    -- Prix minimal : verrouillé une fois validé par la cliente.
    -- .....................................................................
    IF OLD.min_price_validated_at IS NOT NULL
       AND NEW.min_price IS DISTINCT FROM OLD.min_price THEN
        RAISE EXCEPTION 'Le prix minimal a été validé par la cliente : il ne peut plus être modifié.'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Validation : cliente uniquement, irréversible, prix requis.
    IF NEW.min_price_validated_at IS DISTINCT FROM OLD.min_price_validated_at THEN
        IF OLD.min_price_validated_at IS NOT NULL THEN
            RAISE EXCEPTION 'La validation des prix ne peut pas être annulée.'
                USING ERRCODE = 'check_violation';
        END IF;
        IF uid IS DISTINCT FROM req_client THEN
            RAISE EXCEPTION 'Seule la cliente peut valider les prix.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF NEW.min_price IS NULL THEN
            RAISE EXCEPTION 'Impossible de valider un prix minimal vide.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    -- .....................................................................
    -- Prix de départ : vendeuse. Après validation, baissable jusqu'au
    -- plancher accepté par la cliente, jamais en dessous ni au-dessus.
    -- .....................................................................
    IF NEW.starting_price IS DISTINCT FROM OLD.starting_price THEN
        IF uid IS DISTINCT FROM req_seller THEN
            RAISE EXCEPTION 'Seule la vendeuse fixe le prix de départ.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF OLD.min_price_validated_at IS NOT NULL THEN
            IF NEW.starting_price IS NULL THEN
                RAISE EXCEPTION 'Le prix de départ a été validé par la cliente : il ne peut plus être vidé.'
                    USING ERRCODE = 'check_violation';
            END IF;
            IF OLD.starting_price IS NOT NULL AND NEW.starting_price > OLD.starting_price THEN
                RAISE EXCEPTION 'Après validation, le prix de départ ne peut être que baissé.'
                    USING ERRCODE = 'check_violation';
            END IF;
            IF NEW.min_price IS NOT NULL AND NEW.starting_price < NEW.min_price THEN
                RAISE EXCEPTION 'Le prix de départ ne peut pas descendre sous le prix minimal validé par la cliente.'
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    -- .....................................................................
    -- Vente : vendeuse uniquement.
    -- .....................................................................
    IF (NEW.sale_price IS DISTINCT FROM OLD.sale_price
        OR NEW.sale_proof_url IS DISTINCT FROM OLD.sale_proof_url
        OR NEW.sold_at IS DISTINCT FROM OLD.sold_at)
       AND uid IS DISTINCT FROM req_seller THEN
        RAISE EXCEPTION 'Seule la vendeuse peut renseigner la vente.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- .....................................................................
    -- Statut
    -- .....................................................................
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF uid IS DISTINCT FROM req_seller THEN
            RAISE EXCEPTION 'Seule la vendeuse peut changer le statut d''une pièce.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;

        IF NEW.status = 'finalized' THEN
            IF OLD.status <> 'sold' THEN
                RAISE EXCEPTION 'Une pièce doit d''abord être vendue avant d''être finalisée.'
                    USING ERRCODE = 'check_violation';
            END IF;
            IF NEW.sale_price IS NULL OR NEW.sale_price <= 0 THEN
                RAISE EXCEPTION 'Renseignez le prix de vente avant de finaliser.'
                    USING ERRCODE = 'check_violation';
            END IF;
            IF NEW.sale_proof_url IS NULL THEN
                RAISE EXCEPTION 'Déposez le justificatif de virement avant de finaliser.'
                    USING ERRCODE = 'check_violation';
            END IF;
            NEW.finalized_at := COALESCE(NEW.finalized_at, now());
        ELSE
            NEW.finalized_at := NULL;
        END IF;

        IF NEW.status = 'sold' THEN
            IF NEW.sale_price IS NULL OR NEW.sale_price <= 0 THEN
                RAISE EXCEPTION 'Renseignez le prix de vente avant de marquer la pièce vendue.'
                    USING ERRCODE = 'check_violation';
            END IF;
            NEW.sold_at := COALESCE(NEW.sold_at, now());
        -- On efface la date de vente quand la pièce redescend dans le
        -- parcours, mais surtout pas quand elle monte vers « finalized ».
        ELSIF OLD.status = 'sold' AND NEW.status <> 'finalized' THEN
            NEW.sold_at := NULL;
        END IF;

        IF NEW.status = 'unsellable'
           AND (NEW.notes IS NULL OR btrim(NEW.notes) = '') THEN
            RAISE EXCEPTION 'Expliquez dans les notes pourquoi cette pièce est invendable.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_items_pricing_guard ON request_items;
CREATE TRIGGER request_items_pricing_guard
    BEFORE INSERT OR UPDATE ON request_items
    FOR EACH ROW EXECUTE FUNCTION request_items_pricing_guard();

-- ---------------------------------------------------------------------------
-- 4. Suppression d'une pièce finalisée : refusée
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_items_block_finalized_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND OLD.status = 'finalized' THEN
        RAISE EXCEPTION 'Cette pièce est finalisée : elle ne peut plus être supprimée.'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_items_block_finalized_delete ON request_items;
CREATE TRIGGER request_items_block_finalized_delete
    BEFORE DELETE ON request_items
    FOR EACH ROW EXECUTE FUNCTION request_items_block_finalized_delete();

-- ---------------------------------------------------------------------------
-- 5. Index de tri
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS request_items_request_status_idx
    ON request_items (request_id, status);
