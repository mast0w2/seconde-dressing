-- 0008_attach_anonymous_requests.sql
-- Rattache au compte connecté les demandes envoyées anonymement depuis le
-- formulaire public avec la même adresse e-mail (client_id NULL), et les
-- contrats générés dessus. Appelée à chaque connexion et à l'ouverture du
-- tableau de bord cliente (idempotente).
--
-- SECURITY DEFINER : la cliente n'est pas encore partie au contrat au moment
-- du rattachement, la politique RLS de request_contracts lui interdirait la
-- mise à jour. L'e-mail vient du JWT (auth.jwt()), jamais du client.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION attach_anonymous_requests()
RETURNS integer AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION attach_anonymous_requests() FROM public;
GRANT EXECUTE ON FUNCTION attach_anonymous_requests() TO authenticated;
