-- 0025_invendable_sans_note.sql
--
-- Retire l'obligation de renseigner une note pour passer une pièce en
-- « invendable ».
--
-- POURQUOI : à l'usage, cliquer sur « Invendable » ne faisait rien de visible
-- tant qu'aucune note n'était écrite. La vendeuse comprend « c'est cassé »,
-- pas « il manque une information » — et un garde-fou qu'on prend pour un bug
-- est un mauvais garde-fou.
--
-- À la place, l'interface fait passer la pièce en invendable immédiatement et
-- ouvre le champ de notes, avec « Explique pourquoi cet article est
-- invendable. » en invite. L'information est toujours demandée ; elle n'est
-- simplement plus une condition bloquante.
--
-- Tout le reste de 0024 est conservé à l'identique.
-- Rejouable sans risque.

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
        NEW.min_price_validated_at := NULL;
        IF uid IS DISTINCT FROM req_seller THEN
            NEW.sale_price     := NULL;
            NEW.sale_proof_url := NULL;
            NEW.sold_at        := NULL;
        END IF;
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
        RAISE EXCEPTION 'Cette vente est finalisée : elle ne peut plus être modifiée.'
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
                RAISE EXCEPTION 'Déposez la preuve de vente avant de finaliser.'
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

        -- « Invendable » ne demande plus de note en base : c'est l'interface
        -- qui ouvre le champ et réclame l'explication.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_items_pricing_guard ON request_items;
CREATE TRIGGER request_items_pricing_guard
    BEFORE INSERT OR UPDATE ON request_items
    FOR EACH ROW EXECUTE FUNCTION request_items_pricing_guard();
