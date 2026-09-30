-- 0027_suppression_des_pieces.sql
--
-- Rend la suppression d'une pièce réellement possible.
--
-- LE BUG : request_items a des politiques SELECT, INSERT et UPDATE, mais
-- aucune pour DELETE. Avec RLS activé, une politique manquante ne provoque
-- pas d'erreur : la suppression ne trouve simplement aucune ligne à laquelle
-- elle a le droit de toucher, et PostgREST répond « tout va bien, zéro ligne
-- supprimée ». L'interface retirait donc la ligne de l'écran, et elle
-- réapparaissait au rechargement.
--
-- C'est le pire mode d'échec possible : un refus silencieux qui ressemble à
-- un succès. L'interface vérifie maintenant ce qui a été réellement supprimé,
-- mais il fallait d'abord que le droit existe.
--
-- Le garde-fou sur les pièces finalisées (0024) reste au-dessus : une pièce
-- dont la cliente attend l'argent ne se supprime toujours pas.
--
-- Rejouable sans risque.

DROP POLICY IF EXISTS request_items_delete_involved ON public.request_items;

CREATE POLICY request_items_delete_involved ON public.request_items
    FOR DELETE TO authenticated
    USING (
        request_id IN (
            SELECT requests.id FROM requests
             WHERE requests.client_id = auth.uid()
                OR requests.seller_id = auth.uid()
        )
    );
