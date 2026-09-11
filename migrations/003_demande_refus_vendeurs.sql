-- Migration 003: Track per-seller demande refusals
--
-- A vendeur refusing a demande must NOT change its global status, so another
-- vendeur can still accept it. Instead, each refusal is recorded here so the
-- refusing vendeur stops seeing the demande as "nouvelle", while it stays
-- "en_attente" for everyone else until someone accepts it.

CREATE TABLE IF NOT EXISTS demande_refus_vendeurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  vendeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (demande_id, vendeur_id)
);

CREATE INDEX IF NOT EXISTS idx_demande_refus_vendeurs_demande_id
  ON demande_refus_vendeurs(demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_refus_vendeurs_vendeur_id
  ON demande_refus_vendeurs(vendeur_id);

COMMENT ON TABLE demande_refus_vendeurs IS
  'Records each demande a vendeur refused, so the demande stays open for other vendeurs while being hidden from the refusing vendeur.';
