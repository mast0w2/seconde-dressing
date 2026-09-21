-- 0006_request_contracts.sql
-- Contrat de dépôt-vente généré quand la vendeuse passe une demande en
-- « Articles récupérés ». Un seul contrat par demande.
--
-- `content` est un instantané JSON (identités, formule, répartition, pièces)
-- figé au moment de la génération : les modifications ultérieures des profils
-- ou de la demande ne changent pas le contrat signé.
-- Les signatures sont des PNG (data URL) dessinés dans le navigateur, avec
-- l'horodatage et le nom saisi par chaque partie. Safe to re-run.

CREATE TABLE IF NOT EXISTS request_contracts (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id             UUID NOT NULL UNIQUE REFERENCES requests (id) ON DELETE CASCADE,
    client_id              UUID REFERENCES profiles (id) ON DELETE SET NULL,
    seller_id              UUID REFERENCES profiles (id) ON DELETE SET NULL,
    version                TEXT NOT NULL,
    content                JSONB NOT NULL,
    client_signed_at       TIMESTAMP WITH TIME ZONE,
    client_signature       TEXT,
    client_signature_name  TEXT,
    seller_signed_at       TIMESTAMP WITH TIME ZONE,
    seller_signature       TEXT,
    seller_signature_name  TEXT,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_contracts_request_id ON request_contracts (request_id);
CREATE INDEX IF NOT EXISTS idx_request_contracts_client_id  ON request_contracts (client_id);
CREATE INDEX IF NOT EXISTS idx_request_contracts_seller_id  ON request_contracts (seller_id);

COMMENT ON TABLE request_contracts IS
    'Contrat de dépôt-vente généré au passage en items_collected, signé par la cliente et la vendeuse.';
COMMENT ON COLUMN request_contracts.content IS
    'Instantané JSON du contrat (parties, formule, répartition, pièces) figé à la génération.';

-- RLS : seules les deux parties voient le contrat ; seule la vendeuse assignée
-- le crée ; chaque partie peut le mettre à jour (l'API ne touche que ses
-- propres colonnes de signature).
ALTER TABLE request_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS request_contracts_read_involved ON request_contracts;
CREATE POLICY request_contracts_read_involved
    ON request_contracts FOR SELECT
    TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS request_contracts_insert_seller ON request_contracts;
CREATE POLICY request_contracts_insert_seller
    ON request_contracts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS request_contracts_update_involved ON request_contracts;
CREATE POLICY request_contracts_update_involved
    ON request_contracts FOR UPDATE
    TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = client_id OR auth.uid() = seller_id);
