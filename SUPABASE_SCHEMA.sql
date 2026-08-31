-- Seconde Dressing Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  photo_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'vendeuse')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  specialisation TEXT,
  tarif_horaire DECIMAL(10, 2),
  annees_experience INTEGER
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Disponibilites table
CREATE TABLE IF NOT EXISTS disponibilites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut TEXT NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'reserve')),
  est_recurrent BOOLEAN DEFAULT FALSE,
  jour_recurrence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for disponibilites
CREATE INDEX IF NOT EXISTS idx_disponibilites_user_id ON disponibilites(user_id);
CREATE INDEX IF NOT EXISTS idx_disponibilites_date ON disponibilites(date);
CREATE INDEX IF NOT EXISTS idx_disponibilites_statut ON disponibilites(statut);

-- Rendez-vous table
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendeuse_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disponibilite_id UUID NOT NULL REFERENCES disponibilites(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse', 'annule')),
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mis_a_jour_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rendez-vous
CREATE INDEX IF NOT EXISTS idx_rendez_vous_client_id ON rendez_vous(client_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_vendeuse_id ON rendez_vous(vendeuse_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_disponibilite_id ON rendez_vous(disponibilite_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_statut ON rendez_vous(statut);

-- Preferences table
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  langue TEXT NOT NULL DEFAULT 'FR' CHECK (langue IN ('FR', 'EN')),
  fuseau_horaire TEXT NOT NULL DEFAULT 'Europe/Paris',
  theme TEXT NOT NULL DEFAULT 'clair' CHECK (theme IN ('clair', 'sombre')),
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  preferences_ventes JSONB
);

-- Indexes for preferences
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Estimation requests table
CREATE TABLE IF NOT EXISTS estimation_requests (
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for estimation_requests
CREATE INDEX IF NOT EXISTS idx_estimation_requests_email ON estimation_requests(email);
CREATE INDEX IF NOT EXISTS idx_estimation_requests_status ON estimation_requests(status);
CREATE INDEX IF NOT EXISTS idx_estimation_requests_created_at ON estimation_requests(created_at);

-- Function to update mis_a_jour_le timestamp
CREATE OR REPLACE FUNCTION update_mis_a_jour_le()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mis_a_jour_le = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rendez-vous
CREATE TRIGGER update_rendez_vous_timestamp
  BEFORE UPDATE ON rendez_vous
  FOR EACH ROW
  EXECUTE FUNCTION update_mis_a_jour_le();

-- Insert sample data (optional)
-- Uncomment to insert sample data
/*
INSERT INTO profiles (id, nom, prenom, email, role, telephone, bio, specialisation, tarif_horaire, annees_experience)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Dupont',
  'Marie',
  'marie.dupont@example.com',
  'vendeuse',
  '+33123456789',
  'Vendeuse professionnelle avec 5 ans d\'expérience',
  'Vêtements de luxe',
  50.00,
  5
);

INSERT INTO disponibilites (id, user_id, date, heure_debut, heure_fin, statut)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2026-01-15',
  '09:00:00',
  '12:00:00',
  'disponible'
);

INSERT INTO profiles (id, nom, prenom, email, role)
VALUES (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'Martin',
  'Jean',
  'jean.martin@example.com',
  'client'
);

INSERT INTO preferences (id, user_id, langue, fuseau_horaire, theme, notifications_email)
VALUES (
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'FR',
  'Europe/Paris',
  'clair',
  TRUE
);

INSERT INTO preferences (id, user_id, langue, fuseau_horaire, theme, notifications_email)
VALUES (
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'FR',
  'Europe/Paris',
  'clair',
  TRUE
);
*/
