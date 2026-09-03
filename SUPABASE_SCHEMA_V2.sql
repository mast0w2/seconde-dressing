-- Seconde Dressing Database Schema - Version 2
-- Complete schema for the authentication and demande system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE - Users with roles (client or vendeur)
-- ============================================================================

DROP TABLE IF EXISTS profiles CASCADE;

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

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEMANDES TABLE - Requests for appointments (from contact form)
-- ============================================================================

DROP TABLE IF EXISTS demandes CASCADE;

CREATE TYPE statut_demande AS ENUM (
  'en_attente',      -- Waiting for vendeur to accept
  'acceptee',        -- Accepted by vendeur
  'refusee',         -- Refused by vendeur
  'articles_recuperes', -- Articles picked up
  'articles_en_vente', -- Articles on sale
  'terminee'         -- Completed
);

CREATE TABLE demandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Client information
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_nom TEXT NOT NULL,
  client_prenom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT,
  -- Demand details
  type_demande TEXT NOT NULL DEFAULT 'rdv', -- Can be extended for other types
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
  date_confirmée DATE,
  heure_confirmée TIME
);

-- Indexes for demandes
CREATE INDEX idx_demandes_client_id ON demandes(client_id);
CREATE INDEX idx_demandes_vendeur_id ON demandes(vendeur_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);
CREATE INDEX idx_demandes_created_at ON demandes(created_at);

-- Trigger to update updated_at for demandes
CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PREFERENCES TABLE - User preferences
-- ============================================================================

DROP TABLE IF EXISTS preferences CASCADE;

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
-- RENDEZ_VOUS TABLE - Confirmed appointments (optional, can use demandes)
-- ============================================================================

DROP TABLE IF EXISTS rendez_vous CASCADE;

CREATE TYPE statut_rendez_vous AS ENUM (
  'en_attente',
  'confirme',
  'annule',
  'termine'
);

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
-- DISPONIBILITES TABLE - Availability slots for vendeurs
-- ============================================================================

DROP TABLE IF EXISTS disponibilites CASCADE;

CREATE TYPE statut_disponibilite AS ENUM ('disponible', 'reserve');

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
-- REVIEWS TABLE
-- ============================================================================

DROP TABLE IF EXISTS reviews CASCADE;

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
-- CONTACT_MESSAGES TABLE (for general contact, not RDV)
-- ============================================================================

DROP TABLE IF EXISTS contact_messages CASCADE;

CREATE TYPE contact_message_status AS ENUM ('pending', 'read', 'resolved');

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
-- ESTIMATION_REQUESTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS estimation_requests CASCADE;

CREATE TYPE estimation_status AS ENUM ('pending', 'contacted', 'converted', 'rejected');

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
