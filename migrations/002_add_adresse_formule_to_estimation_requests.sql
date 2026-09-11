-- Ajoute l'adresse de collecte, la formule choisie et le consentement aux critères
-- de reprise sur les demandes d'estimation.
-- À exécuter dans l'éditeur SQL de Supabase avant de déployer le nouveau formulaire :
-- sans ces colonnes, l'enregistrement d'une demande échouera.

ALTER TABLE estimation_requests
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS formule TEXT,
  ADD COLUMN IF NOT EXISTS conditions_acceptees BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN estimation_requests.adresse IS 'Adresse de collecte, saisie via la Base Adresse Nationale';
COMMENT ON COLUMN estimation_requests.formule IS 'Formule choisie : deja-trie (10 EUR), tri-sur-place (30 EUR), tri-et-conseil (50 EUR)';
COMMENT ON COLUMN estimation_requests.conditions_acceptees IS 'La cliente a confirmé que ses pièces respectent les critères de reprise';
