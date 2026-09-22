-- 0011_requests_rls.sql
-- Active la Row Level Security sur `requests` et retire à `anon` les droits
-- qu'il n'aurait jamais dû avoir.
--
-- CONSTAT : la RLS était désactivée sur cette table — ses cinq politiques
-- étaient donc inertes depuis le début, malgré ce qu'annonce
-- RLS_IMPLEMENTATION.md. Combiné aux GRANT par défaut, cela donnait au rôle
-- `anon` — dont la clé est publiée dans le bundle JS du site — SELECT, UPDATE
-- et DELETE sur toutes les demandes : email, téléphone et adresse postale de
-- chaque cliente, lisibles et modifiables par quiconque.
--
-- ORDRE DE DÉPLOIEMENT : cette migration doit être appliquée APRÈS le
-- déploiement du code. `/api/appointment-request` écrivait la demande avec le
-- client anonyme puis relisait l'identifiant inséré (`.select('id')`). Sous
-- RLS, un RETURNING exige une politique de lecture, qu'une visiteuse non
-- connectée n'a pas : l'insertion échouerait et la demande serait perdue.
-- Le code écrit désormais avec la clé service role, qui n'est pas soumise à
-- la RLS.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Les droits de table.
-- ---------------------------------------------------------------------------
-- `anon` ne garde que l'insertion, utilisée par le formulaire public quand la
-- clé service role n'est pas configurée (développement local). La lecture de
-- `id` permet à ce repli de récupérer l'identifiant inséré.
REVOKE ALL ON requests FROM anon;
GRANT INSERT ON requests TO anon;
GRANT SELECT (id) ON requests TO anon;

-- Aucune politique DELETE n'existe : le droit n'a pas lieu d'être.
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON requests FROM authenticated;

-- ---------------------------------------------------------------------------
-- 2. La RLS elle-même : c'est elle qui rend les politiques existantes actives.
-- ---------------------------------------------------------------------------
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
