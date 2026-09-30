-- 0026_validation_des_prix.sql
--
-- La cliente valide les prix avant la mise en vente.
--
-- LE PARCOURS
--   1. La vendeuse remplit l'inventaire : photo, description, marque, prix de
--      départ, prix minimal. Les pièces sont en « photos_taken ».
--   2. Quand tout est renseigné, elle envoie l'ensemble à la cliente. Les
--      pièces passent en « awaiting_client » et prices_sent_at est horodaté.
--   3. La cliente a 48 h. Elle peut ajuster le prix de départ et le prix
--      minimal, laisser une note par pièce, puis valider — pièce par pièce.
--      Valider verrouille le prix minimal, comme avant.
--   4. Sans réponse au bout de 48 h, les prix proposés s'appliquent et la
--      pièce part en vente. Le silence vaut accord : c'est annoncé à la
--      cliente, et sans cela un inventaire resterait bloqué indéfiniment.
--
-- POURQUOI LA CLIENTE PEUT MODIFIER
--   Jusqu'ici seule la vendeuse fixait le prix de départ. Mais ce sont les
--   vêtements de la cliente : lui demander de valider un prix sans pouvoir le
--   discuter n'est pas une validation, c'est une notification.
--
-- Rejouable sans risque.

-- ---------------------------------------------------------------------------
-- 1. Nouvel état, entre l'inventaire et la vente
-- ---------------------------------------------------------------------------
ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'awaiting_client' AFTER 'photos_taken';

ALTER TABLE request_items
    ADD COLUMN IF NOT EXISTS prices_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS client_note    TEXT;

COMMENT ON COLUMN request_items.prices_sent_at IS
    'Envoi des prix à la cliente. Point de départ des 48 h au-delà desquelles le silence vaut accord.';
COMMENT ON COLUMN request_items.client_note IS
    'Remarque laissée par la cliente au moment de valider les prix. Distincte de notes, qui appartient à la vendeuse.';

-- Délai de réponse laissé à la cliente. Une fonction plutôt qu'une constante
-- dispersée : l'interface et la base doivent compter la même chose.
CREATE OR REPLACE FUNCTION request_items_delai_validation()
RETURNS INTERVAL AS $$
    SELECT INTERVAL '48 hours';
$$ LANGUAGE sql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- 2. Règles d'écriture
--    Remplace la fonction de 0025 en gardant tout ce qu'elle faisait.
--
--    NOTE si PostgreSQL refuse ce fichier d'un bloc en se plaignant d'un
--    « unsafe use of new value of enum type » : exécutez la partie 1 seule,
--    puis la partie 2. Une valeur d'enum ajoutée ne peut pas toujours servir
--    dans la même transaction que son ajout.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_items_pricing_guard()
RETURNS TRIGGER AS $$
DECLARE
    uid          UUID := auth.uid();
    req_client   UUID;
    req_seller   UUID;
    est_cliente  BOOLEAN;
    est_vendeuse BOOLEAN;
    valide_ici   BOOLEAN;
    delai_passe  BOOLEAN;
BEGIN
    -- Service role / migrations : pas d'utilisateur, on laisse passer.
    IF uid IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT client_id, seller_id INTO req_client, req_seller
    FROM requests WHERE id = NEW.request_id;

    est_cliente  := uid IS NOT DISTINCT FROM req_client;
    est_vendeuse := uid IS NOT DISTINCT FROM req_seller;

    -- .....................................................................
    -- INSERT : une pièce naît toujours au début du parcours.
    -- .....................................................................
    IF TG_OP = 'INSERT' THEN
        NEW.min_price_validated_at := NULL;
        IF NOT est_vendeuse THEN
            NEW.sale_price     := NULL;
            NEW.sale_proof_url := NULL;
            NEW.sold_at        := NULL;
        END IF;
        NEW.status         := 'photos_taken';
        NEW.finalized_at   := NULL;
        NEW.prices_sent_at := NULL;
        RETURN NEW;
    END IF;

    -- .....................................................................
    -- Ligne finalisée : plus rien ne bouge, pour personne.
    -- .....................................................................
    IF OLD.status = 'finalized' THEN
        RAISE EXCEPTION 'Cette vente est finalisée : elle ne peut plus être modifiée.'
            USING ERRCODE = 'check_violation';
    END IF;

    valide_ici  := NEW.min_price_validated_at IS DISTINCT FROM OLD.min_price_validated_at;
    delai_passe := OLD.prices_sent_at IS NOT NULL
                   AND now() > OLD.prices_sent_at + request_items_delai_validation();

    -- .....................................................................
    -- Prix minimal : verrouillé une fois validé par la cliente.
    -- .....................................................................
    IF OLD.min_price_validated_at IS NOT NULL
       AND NEW.min_price IS DISTINCT FROM OLD.min_price THEN
        RAISE EXCEPTION 'Le prix minimal a été validé par la cliente : il ne peut plus être modifié.'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Validation : la cliente. Le trigger s'autorise à la poser lui-même
    -- quand le délai de réponse est écoulé (plus bas) ; ici on ne contrôle
    -- que ce qui vient de l'appelant.
    IF valide_ici THEN
        IF OLD.min_price_validated_at IS NOT NULL THEN
            RAISE EXCEPTION 'La validation des prix ne peut pas être annulée.'
                USING ERRCODE = 'check_violation';
        END IF;
        IF NOT est_cliente THEN
            RAISE EXCEPTION 'Seule la cliente peut valider les prix.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF NEW.min_price IS NULL THEN
            RAISE EXCEPTION 'Impossible de valider un prix minimal vide.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    -- .....................................................................
    -- Prix de départ : la vendeuse le propose, la cliente peut l'ajuster
    -- tant qu'elle n'a pas validé et que les prix lui sont soumis.
    -- .....................................................................
    IF NEW.starting_price IS DISTINCT FROM OLD.starting_price THEN
        IF NOT est_vendeuse
           AND NOT (est_cliente AND OLD.status = 'awaiting_client'
                    AND OLD.min_price_validated_at IS NULL) THEN
            RAISE EXCEPTION 'Le prix de départ ne peut pas être modifié à ce stade.'
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

    -- La note de la cliente lui appartient.
    IF NEW.client_note IS DISTINCT FROM OLD.client_note AND NOT est_cliente THEN
        RAISE EXCEPTION 'Cette remarque appartient à la cliente.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- .....................................................................
    -- Vente : vendeuse uniquement.
    -- .....................................................................
    IF (NEW.sale_price IS DISTINCT FROM OLD.sale_price
        OR NEW.sale_proof_url IS DISTINCT FROM OLD.sale_proof_url
        OR NEW.sold_at IS DISTINCT FROM OLD.sold_at)
       AND NOT est_vendeuse THEN
        RAISE EXCEPTION 'Seule la vendeuse peut renseigner la vente.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- .....................................................................
    -- Statut
    -- .....................................................................
    IF NEW.status IS DISTINCT FROM OLD.status THEN

        -- Soumettre les prix : la vendeuse, et seulement si la pièce est
        -- complète. Une cliente ne peut pas valider ce qu'elle ne voit pas.
        IF NEW.status = 'awaiting_client' THEN
            IF NOT est_vendeuse THEN
                RAISE EXCEPTION 'Seule la vendeuse envoie les prix à la cliente.'
                    USING ERRCODE = 'insufficient_privilege';
            END IF;
            IF OLD.status <> 'photos_taken' THEN
                RAISE EXCEPTION 'Les prix ne se soumettent qu''avant la mise en vente.'
                    USING ERRCODE = 'check_violation';
            END IF;
            IF NEW.photo_url IS NULL
               OR NEW.description IS NULL OR btrim(NEW.description) = ''
               OR NEW.brand IS NULL OR btrim(NEW.brand) = ''
               OR NEW.starting_price IS NULL
               OR NEW.min_price IS NULL THEN
                RAISE EXCEPTION 'Complétez la photo, la description, la marque et les deux prix avant d''envoyer à la cliente.'
                    USING ERRCODE = 'check_violation';
            END IF;
            NEW.prices_sent_at := COALESCE(NEW.prices_sent_at, now());

        -- Mise en vente : la cliente valide, ou le délai de réponse est
        -- écoulé et le silence vaut accord.
        ELSIF NEW.status = 'on_sale' AND OLD.status = 'awaiting_client' THEN
            IF est_cliente THEN
                NEW.min_price_validated_at :=
                    COALESCE(NEW.min_price_validated_at, now());
            ELSIF est_vendeuse THEN
                IF NOT delai_passe THEN
                    RAISE EXCEPTION 'La cliente a encore le temps de répondre : attendez sa validation ou la fin du délai.'
                        USING ERRCODE = 'check_violation';
                END IF;
                -- Sans réponse, les prix proposés sont réputés acceptés :
                -- on les verrouille comme une validation ordinaire.
                NEW.min_price_validated_at :=
                    COALESCE(OLD.min_price_validated_at, now());
            ELSE
                RAISE EXCEPTION 'Vous ne pouvez pas mettre cette pièce en vente.'
                    USING ERRCODE = 'insufficient_privilege';
            END IF;

        -- Tout le reste appartient à la vendeuse.
        ELSE
            IF NOT est_vendeuse THEN
                RAISE EXCEPTION 'Seule la vendeuse peut changer le statut d''une pièce.'
                    USING ERRCODE = 'insufficient_privilege';
            END IF;
        END IF;

        -- Revenir en arrière remet le compteur à zéro.
        IF OLD.status = 'awaiting_client' AND NEW.status = 'photos_taken' THEN
            NEW.prices_sent_at := NULL;
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS request_items_pricing_guard ON request_items;
CREATE TRIGGER request_items_pricing_guard
    BEFORE INSERT OR UPDATE ON request_items
    FOR EACH ROW EXECUTE FUNCTION request_items_pricing_guard();
