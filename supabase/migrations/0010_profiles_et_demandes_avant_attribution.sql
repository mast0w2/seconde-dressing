-- 0010_profiles_et_demandes_avant_attribution.sql
-- Une vendeuse ne voit que l'adresse d'une demande tant qu'elle ne l'a pas
-- acceptée. Nom, email et téléphone n'apparaissent qu'après attribution.
--
-- Le tableau de bord vendeuse appliquait déjà cette règle à l'affichage
-- (« Coordonnées visibles après acceptation »), mais les données partaient
-- quand même dans la réponse réseau : il suffisait d'ouvrir les outils de
-- développement. Deux chemins les transportaient :
--
--   1. la jointure client:client_id vers `profiles`, ouverte par
--      `profiles_read_own_or_any` en USING (true) — tout compte connecté
--      lisait tous les profils, et un compte se crée en une minute depuis le
--      formulaire public ;
--   2. les colonnes dénormalisées client_first_name / client_last_name /
--      client_email / client_phone portées par `requests` elle-même, que
--      `requests_read_own_as_seller` exposait à tout compte connecté via sa
--      branche `OR status = 'pending'`.
--
-- On ferme les deux, et on rouvre le strict nécessaire par une vue dédiée.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. `profiles` : soi, et les personnes avec qui on a une demande attribuée.
-- ---------------------------------------------------------------------------
-- La vendeuse lit le profil de sa cliente pour établir le contrat
-- (src/app/api/contracts/route.ts) ; la cliente lit celui de la vendeuse qui
-- vient chez elle. Les deux exigent seller_id renseigné : une demande encore
-- en attente n'ouvre aucun profil.
DROP POLICY IF EXISTS "profiles_read_own_or_any" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own_or_related" ON profiles;

CREATE POLICY "profiles_read_own_or_related"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1
              FROM requests r
             WHERE r.seller_id IS NOT NULL
               AND (
                     (r.seller_id = auth.uid() AND r.client_id = profiles.id)
                  OR (r.client_id = auth.uid() AND r.seller_id = profiles.id)
                   )
        )
    );

-- Sans index, chaque lecture de profil balaye `requests`.
CREATE INDEX IF NOT EXISTS idx_requests_seller_client ON requests (seller_id, client_id);
CREATE INDEX IF NOT EXISTS idx_requests_client_seller ON requests (client_id, seller_id);

-- ---------------------------------------------------------------------------
-- 2. `requests` : plus de lecture des demandes qu'on ne s'est pas attribuées.
-- ---------------------------------------------------------------------------
-- La branche `OR status = 'pending'` livrait la ligne entière, colonnes de
-- contact comprises. La mise à jour garde cette branche : c'est elle qui
-- permet à une vendeuse de s'attribuer une demande ouverte.
DROP POLICY IF EXISTS "requests_read_own_as_seller" ON requests;

CREATE POLICY "requests_read_own_as_seller"
    ON requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- 3. Le tableau des demandes ouvertes, sans aucune coordonnée.
-- ---------------------------------------------------------------------------
-- Vue SECURITY DEFINER : elle contourne la RLS de `requests` pour exposer les
-- seules colonnes nécessaires au choix d'une demande. Les colonnes de contact
-- en sont absentes — elles ne peuvent donc pas fuiter, quoi que demande
-- l'appelant. L'accès est réservé aux vendeuses par le EXISTS ci-dessous.
DROP VIEW IF EXISTS requests_ouvertes;

CREATE VIEW requests_ouvertes AS
SELECT
    r.id,
    r.created_at,
    r.updated_at,
    r.status,
    r.request_type,
    r.address,
    r.formula_id,
    r.number_of_items,
    r.average_value,
    r.brands,
    r.description,
    r.message,
    r.estimate,
    r.conditions_accepted,
    r.seller_id
  FROM requests r
 WHERE r.status = 'pending'
   AND r.seller_id IS NULL
   AND EXISTS (
        SELECT 1 FROM profiles p
         WHERE p.id = auth.uid()
           AND p.role = 'seller'
   );

ALTER VIEW requests_ouvertes SET (security_invoker = off);

REVOKE ALL ON requests_ouvertes FROM anon;
GRANT SELECT ON requests_ouvertes TO authenticated;
