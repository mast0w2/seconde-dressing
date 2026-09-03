-- Migration 002: Complete Schema V2 for Seconde Dressing
-- This migration creates all necessary tables for the new authentication and demande system
-- Execute this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create ENUM types
-- ============================================================================

DO $$
BEGIN
  -- Check and create statut_demande enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_demande') THEN
    CREATE TYPE statut_demande AS ENUM (
      'en_attente',
      'acceptee',
      'refusee',
      'articles_recuperes',
      'articles_en_vente',
      'terminee'
    );
    RAISE NOTICE 'Created enum: statut_demande';
  END IF;

  -- Check and create statut_disponibilite enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_disponibilite') THEN
    CREATE TYPE statut_disponibilite AS ENUM ('disponible', 'reserve');
    RAISE NOTICE 'Created enum: statut_disponibilite';
  END IF;

  -- Check and create statut_rendez_vous enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_rendez_vous') THEN
    CREATE TYPE statut_rendez_vous AS ENUM ('en_attente', 'confirme', 'annule', 'termine');
    RAISE NOTICE 'Created enum: statut_rendez_vous';
  END IF;

  -- Check and create contact_message_status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_message_status') THEN
    CREATE TYPE contact_message_status AS ENUM ('pending', 'read', 'resolved');
    RAISE NOTICE 'Created enum: contact_message_status';
  END IF;

  -- Check and create estimation_status enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estimation_status') THEN
    CREATE TYPE estimation_status AS ENUM ('pending', 'contacted', 'converted', 'rejected');
    RAISE NOTICE 'Created enum: estimation_status';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop existing tables (if they exist) - CAREFUL: This will delete data!
-- ============================================================================

DROP TABLE IF EXISTS estimation_requests CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS rendez_vous CASCADE;
DROP TABLE IF EXISTS disponibilites CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- STEP 3: Create profiles table with full address support
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Personal information
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  photo_url TEXT,
  -- Address fields
  adresse_rue TEXT,
  adresse_ville TEXT,
  adresse_code_postal TEXT,
  adresse_pays TEXT DEFAULT 'France',
  -- Role
  role TEXT NOT NULL CHECK (role IN ('client', 'vendeur')),
  -- Professional info (for vendeur)
  bio TEXT,
  specialisation TEXT,
  tarif_horaire DECIMAL(10, 2),
  annees_experience INTEGER,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- ============================================================================
-- STEP 4: Create function and triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create demandes table
-- ============================================================================

CREATE TABLE demandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Client information
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_nom TEXT NOT NULL,
  client_prenom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT,
  -- Demand details
  type_demande TEXT NOT NULL DEFAULT 'rdv',
  message TEXT NOT NULL,
  -- Status
  statut statut_demande NOT NULL DEFAULT 'en_attente',
  -- Assigned vendeur (if accepted)
  vendeur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Date/time for the appointment
  date_proposee DATE,
  heure_proposee TIME,
  -- Final appointment details (once accepted)
  date_confirmee DATE,
  heure_confirmee TIME
);

-- Indexes for demandes
CREATE INDEX idx_demandes_client_id ON demandes(client_id);
CREATE INDEX idx_demandes_vendeur_id ON demandes(vendeur_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);
CREATE INDEX idx_demandes_created_at ON demandes(created_at);

-- Trigger for demandes
CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Create preferences table
-- ============================================================================

CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  langue TEXT NOT NULL DEFAULT 'FR' CHECK (langue IN ('FR', 'EN')),
  fuseau_horaire TEXT NOT NULL DEFAULT 'Europe/Paris',
  theme TEXT NOT NULL DEFAULT 'clair' CHECK (theme IN ('clair', 'sombre')),
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preferences_user_id ON preferences(user_id);

-- ============================================================================
-- STEP 7: Create disponibilites table
-- ============================================================================

CREATE TABLE disponibilites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut statut_disponibilite NOT NULL DEFAULT 'disponible',
  est_recurrent BOOLEAN DEFAULT FALSE,
  jour_recurrence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disponibilites_user_id ON disponibilites(user_id);
CREATE INDEX idx_disponibilites_date ON disponibilites(date);

-- ============================================================================
-- STEP 8: Create rendez_vous table
-- ============================================================================

CREATE TABLE rendez_vous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id UUID REFERENCES demandes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut statut_rendez_vous NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rendez_vous_client_id ON rendez_vous(client_id);
CREATE INDEX idx_rendez_vous_vendeur_id ON rendez_vous(vendeur_id);
CREATE INDEX idx_rendez_vous_demande_id ON rendez_vous(demande_id);
CREATE INDEX idx_rendez_vous_statut ON rendez_vous(statut);

CREATE TRIGGER update_rendez_vous_updated_at
  BEFORE UPDATE ON rendez_vous
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Create reviews table
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendeur_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_vendeur_id ON reviews(vendeur_id);

-- ============================================================================
-- STEP 10: Create contact_messages table
-- ============================================================================

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_message_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- ============================================================================
-- STEP 11: Create estimation_requests table
-- ============================================================================

CREATE TABLE estimation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  nombre_vetements INTEGER NOT NULL,
  valeur_moyenne DECIMAL(10, 2) NOT NULL,
  marques TEXT NOT NULL,
  description TEXT,
  estimation DECIMAL(10, 2) NOT NULL,
  status estimation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_estimation_requests_email ON estimation_requests(email);
CREATE INDEX idx_estimation_requests_status ON estimation_requests(status);

-- ============================================================================
-- STEP 12: Create trigger for profiles updated_at
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

RAISE NOTICE 'Migration 002 completed successfully!';
RAISE NOTICE 'All tables created: profiles, demandes, preferences, disponibilites, rendez_vous, reviews, contact_messages, estimation_requests';
