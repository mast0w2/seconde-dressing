-- ============================================================
-- SECONDE DRESSING - Database schema (English version)
-- Drop legacy tables and create the new schema from scratch.
-- Database is empty: legacy tables (demandes, estimation_requests,
-- rendez_vous, disponibilites) are dropped if present.
-- Applied on Supabase - 11/09/2026
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Drop legacy tables (idempotent)
-- ============================================================
DROP TABLE IF EXISTS rendez_vous CASCADE;
DROP TABLE IF EXISTS estimation_requests CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS disponibilites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop legacy enums if present
DROP TYPE IF EXISTS statut_demande CASCADE;
DROP TYPE IF EXISTS statut_disponibilite CASCADE;
DROP TYPE IF EXISTS statut_rendez_vous CASCADE;
DROP TYPE IF EXISTS estimation_status CASCADE;

-- Drop legacy trigger function if present
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================================
-- ENUMS (idempotent: create only if missing)
-- ============================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM (
            'pending',
            'accepted',
            'refused',
            'items_collected',
            'items_on_sale',
            'completed'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        CREATE TYPE availability_status AS ENUM (
            'available',
            'booked'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_message_status') THEN
        CREATE TYPE contact_message_status AS ENUM (
            'pending',
            'read',
            'resolved'
        );
    END IF;
END $$;

-- ============================================================
-- profiles (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_name        TEXT NOT NULL,
    first_name       TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    phone            TEXT,
    photo_url         TEXT,
    street_address   TEXT,
    city             TEXT,
    postal_code      TEXT,
    country          TEXT DEFAULT 'France',
    role             TEXT NOT NULL CHECK (role IN ('client', 'seller')),
    bio              TEXT,
    specialization   TEXT,
    hourly_rate      DECIMAL(10, 2),
    years_experience INTEGER,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email      ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at);

-- ============================================================
-- formulas (priced service formulas)
-- ============================================================
CREATE TABLE IF NOT EXISTS formulas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        TEXT NOT NULL UNIQUE,        -- 'pre-sorted' | 'on-site-sorting' | 'sorting-and-advice'
    label       TEXT NOT NULL,               -- UI label (FR): 'Déjà trié' | 'Tri sur place' | 'Tri et conseil'
    price       DECIMAL(10, 2) NOT NULL,    -- 10.00 | 30.00 | 50.00
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO formulas (slug, label, price, description) VALUES
    ('pre-sorted',         'Déjà trié',      10.00, 'The customer has already sorted the items.'),
    ('on-site-sorting',    'Tri sur place',  30.00, 'The seller sorts the items on site.'),
    ('sorting-and-advice', 'Tri et conseil', 50.00, 'The seller sorts the items and gives styling advice.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- requests (merged: appointments + estimation requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS requests (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id            UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    request_type         TEXT NOT NULL DEFAULT 'appointment',
    message              TEXT,
    status               request_status NOT NULL DEFAULT 'pending',
    seller_id            UUID REFERENCES profiles (id) ON DELETE SET NULL,
    proposed_date        DATE,
    proposed_time        TIME,
    confirmed_date       DATE,
    confirmed_time       TIME,
    address              TEXT,              -- collection address, entered via Base Adresse Nationale
    formula_id           UUID REFERENCES formulas (id) ON DELETE SET NULL,
    conditions_accepted  BOOLEAN NOT NULL DEFAULT FALSE, -- customer confirmed items meet reprise criteria
    number_of_items      INTEGER,
    average_value        DECIMAL(10, 2),
    brands               TEXT,
    description          TEXT,
    estimate             DECIMAL(10, 2),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_client_id  ON requests (client_id);
CREATE INDEX IF NOT EXISTS idx_requests_seller_id  ON requests (seller_id);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_formula_id ON requests (formula_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at);

-- ============================================================
-- preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES profiles (id) ON DELETE CASCADE,
    language            TEXT DEFAULT 'FR',
    timezone            TEXT DEFAULT 'Europe/Paris',
    theme               TEXT DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications   BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- availabilities
-- ============================================================
CREATE TABLE IF NOT EXISTS availabilities (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    date           DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    status         availability_status NOT NULL DEFAULT 'available',
    is_recurring   BOOLEAN DEFAULT FALSE,
    recurrence_day TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    seller_id   UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    subject     TEXT NOT NULL,
    message     TEXT NOT NULL,
    status      contact_message_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
