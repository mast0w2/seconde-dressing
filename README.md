# Seconde Dressing

> **Seconde Dressing** est une plateforme de mise en relation entre clients et vendeurs professionnels pour la vente de vêtements d'occasion. Ce projet est construit avec Next.js 14, TypeScript, et Supabase pour offrir une expérience utilisateur fluide et sécurisée.

---

## 🎯 Nouveau Système d'Authentification et de Demandes

### Fonctionnalités Principales (V2) :

#### Pour les Clients :
- ✅ **Inscription complète** avec nom, prénom, téléphone, adresse postale (rue, ville, code postal)
- ✅ **Sélection de rôle** lors de l'inscription (client ou vendeur)
- ✅ **Connexion claire** avec messages d'erreur explicites
- ✅ **Demande de RDV** via formulaire dédié avec message et dates optionnelles
- ✅ **Tableau de bord client** pour suivre l'état des demandes
- ✅ **Profil complet** avec toutes les informations personnelles et adresse
- ✅ **Navigation intuitive** avec liens adaptés au rôle

#### Pour les Vendeurs :
- ✅ **Espace Vendeur dédié** (`/vendeur`) avec statistiques et guide
- ✅ **Tableau de bord vendeur** pour gérer toutes les demandes
- ✅ **Actions sur les demandes** : Accepter, Refuser, Mettre à jour le statut
- ✅ **Workflow complet** : en_attente → acceptée → articles_récupérés → articles_en_vente → terminée
- ✅ **Profil professionnel** avec informations spécifiques (spécialisation, tarif, expérience)

#### Système de Demandes :
- ✅ **Nouvelle table `demandes`** avec tous les statuts nécessaires
- ✅ **Création automatique** lors de la soumission du formulaire
- ✅ **Gestion par les vendeurs** avec actions claires
- ✅ **Suivi par les clients** en temps réel

---

## 📋 Fonctionnalités

### Pour les Clients :
- ✅ Création de compte avec toutes les informations requises
- ✅ Recherche et sélection de vendeurs
- ✅ Prise de rendez-vous en ligne via formulaire
- ✅ Suivi des demandes et historique
- ✅ Soumission d'avis et notation

### Pour les Vendeurs :
- ✅ Gestion de profil professionnel
- ✅ Configuration des disponibilités
- ✅ Réception et gestion des demandes de RDV
- ✅ Acceptation/Refus des rendez-vous
- ✅ Tableau de bord avec statistiques

### Fonctionnalités Système :
- ✅ Système de notification par email (Brevo)
- ✅ Authentification sécurisée (Supabase Auth)
- ✅ Gestion des formulaires de contact
- ✅ Design responsive (Mobile-first)
- ✅ Interface multilingue (Français)

---

## 🚀 Démarrage Rapide

### Prérequis :

- [Node.js](https://nodejs.org/) v18.17 ou supérieur
- [npm](https://www.npmjs.com/) v9 ou supérieur (ou [yarn](https://yarnpkg.com/))
- [Git](https://git-scm.com/)
- Un compte [Supabase](https://supabase.com/) (pour la base de données et l'authentification)
- Un compte [Brevo](https://www.brevo.com/) (pour l'envoi d'emails)

---

### 1. Cloner le dépôt :

```bash
# HTTPS
git clone https://github.com/mast0w2/seconde-dressing.git
cd seconde-dressing

# ou SSH
git clone git@github.com:mast0w2/seconde-dressing.git
cd seconde-dressing
```

---

### 2. Installer les dépendances :

```bash
# Avec npm
npm install

# Avec yarn
# yarn install
```

> ⚠️ **Note** : L'installation peut prendre quelques minutes selon votre connexion internet.

---

### 3. Configurer les variables d'environnement :

Copiez le fichier d'exemple et configurez vos variables :

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Ou créer un nouveau fichier
nano .env.local  # ou utilisez votre éditeur préféré
```

#### Variables requises dans `.env.local` :

```env
# ============================================================================
# Supabase Configuration (Required)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ============================================================================
# Brevo (Sendinblue) Email Service (Required for email functionality)
# ============================================================================
BREVO_API_KEY=your_brevo_smtp_api_key
EMAIL_FROM="Seconde Dressing <no-reply@your-domain.com>"

# ============================================================================
# Application Configuration
# ============================================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Où trouver ces informations :

| Variable | Source | Comment l'obtenir |
|----------|--------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Paramètres > API > URL du projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Paramètres > API > Clé anonyme |
| `BREVO_API_KEY` | [Brevo Dashboard](https://app.brevo.com) | Paramètres > Clés API > Créer une clé SMTP |
| `EMAIL_FROM` | Votre domaine | Email vérifié dans Brevo |

---

### 4. Configurer Supabase :

1. **Créer un projet Supabase** : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Créer les tables** : Exécutez le script SQL suivant dans l'interface SQL de Supabase :

```sql
-- ============================================================================
-- SCHEMA V2 - Complete Database Schema
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Role enum
CREATE TYPE role_enum AS ENUM ('client', 'vendeur');

-- Statut Demande enum
CREATE TYPE statut_demande_enum AS ENUM (
  'en_attente',
  'acceptee',
  'refusee',
  'articles_recuperes',
  'articles_en_vente',
  'terminee'
);

-- Statut Disponibilite enum
CREATE TYPE statut_disponibilite_enum AS ENUM ('disponible', 'reserve');

-- Statut RendezVous enum
CREATE TYPE statut_rendez_vous_enum AS ENUM ('en_attente', 'confirme', 'annule', 'termine');

-- Langue enum
CREATE TYPE langue_enum AS ENUM ('FR', 'EN');

-- Theme enum
CREATE TYPE theme_enum AS ENUM ('clair', 'sombre');

-- Contact Message Status enum
CREATE TYPE contact_message_status_enum AS ENUM ('pending', 'read', 'resolved');

-- Estimation Status enum
CREATE TYPE estimation_status_enum AS ENUM ('pending', 'contacted', 'converted', 'rejected');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  role role_enum NOT NULL,
  -- Professional info (for vendeur)
  bio TEXT,
  specialisation TEXT,
  tarif_horaire NUMERIC,
  annees_experience INTEGER,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ============================================================================
-- DEMANDES TABLE (New V2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS demandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_nom TEXT NOT NULL,
  client_prenom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT,
  type_demande TEXT NOT NULL DEFAULT 'rdv',
  message TEXT NOT NULL,
  statut statut_demande_enum NOT NULL DEFAULT 'en_attente',
  vendeur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date_proposee DATE,
  heure_proposee TIME,
  dates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for demandes
CREATE INDEX IF NOT EXISTS idx_demandes_client_id ON demandes(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_vendeur_id ON demandes(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_created_at ON demandes(created_at);

-- ============================================================================
-- PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  langue langue_enum NOT NULL DEFAULT 'FR',
  fuseau_horaire TEXT NOT NULL DEFAULT 'Europe/Paris',
  theme theme_enum NOT NULL DEFAULT 'clair',
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for preferences
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);

-- ============================================================================
-- DISPONIBILITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS disponibilites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut statut_disponibilite_enum NOT NULL DEFAULT 'disponible',
  est_recurrent BOOLEAN DEFAULT FALSE,
  jour_recurrence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for disponibilites
CREATE INDEX IF NOT EXISTS idx_disponibilites_user_id ON disponibilites(user_id);
CREATE INDEX IF NOT EXISTS idx_disponibilites_date ON disponibilites(date);
CREATE INDEX IF NOT EXISTS idx_disponibilites_statut ON disponibilites(statut);

-- ============================================================================
-- RENDEZ_VOUS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disponibilite_id UUID NOT NULL REFERENCES disponibilites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut statut_rendez_vous_enum NOT NULL DEFAULT 'en_attente',
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mis_a_jour_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rendez_vous
CREATE INDEX IF NOT EXISTS idx_rendez_vous_client_id ON rendez_vous(client_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_vendeur_id ON rendez_vous(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_date ON rendez_vous(date);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTACT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_message_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ESTIMATION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status estimation_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for demandes
CREATE POLICY "Clients can view their own demandes" ON demandes
  FOR SELECT USING (
    auth.uid() = client_id OR
    (role = 'vendeur' AND (vendeur_id = auth.uid() OR vendeur_id IS NULL))
  );

CREATE POLICY "Vendeurs can update demandes assigned to them" ON demandes
  FOR UPDATE USING (
    vendeur_id = auth.uid() OR
    (vendeur_id IS NULL AND role = 'vendeur')
  );

-- RLS Policies for preferences
CREATE POLICY "Users can manage their own preferences" ON preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for disponibilites
CREATE POLICY "Users can manage their own disponibilites" ON disponibilites
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for rendez_vous
CREATE POLICY "Users can view their own rendez-vous" ON rendez_vous
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = vendeur_id);

CREATE POLICY "Users can update their own rendez-vous" ON rendez_vous
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = vendeur_id);
```

3. **Configurer l'authentification** :
   - Allez dans **Auth > Paramètres**
   - Activez **Email/Password** auth
   - Activez **Email confirmations**
   - Configurez votre **Site URL** : `http://localhost:3000` (ou votre URL de production)

---

### 5. Démarrer l'application :

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera disponible à l'adresse : [http://localhost:3000](http://localhost:3000)

---

## 📁 Structure du Projet

```
seconde-dressing/
├── src/
│   ├── app/                          # Pages et API routes
│   │   ├── api/                      # API endpoints
│   │   │   ├── auth/                 # Authentification
│   │   │   │   └── callback/         # OAuth callback
│   │   │   ├── contact/              # Formulaire de contact
│   │   │   ├── notifications/        # Notifications email
│   │   │   └── reviews/              # Avis clients
│   │   ├── (auth)/                   # Pages d'authentification
│   │   │   ├── login/               # Connexion
│   │   │   ├── signup/              # Inscription
│   │   │   └── forgot-password/     # Mot de passe oublié
│   │   ├── dashboard/               # Tableau de bord (clients & vendeurs)
│   │   │   └── page.tsx
│   │   ├── demande-rdv/             # Formulaire de demande de RDV
│   │   │   └── page.tsx
│   │   ├── profile/                 # Profil utilisateur
│   │   │   └── page.tsx
│   │   ├── preferences/             # Préférences utilisateur
│   │   │   └── page.tsx
│   │   ├── vendeur/                 # Espace vendeur
│   │   │   └── page.tsx
│   │   └── page.tsx                 # Page d'accueil
│   │
│   ├── components/                  # Composants React
│   │   ├── ui/                      # Composants UI (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   └── Navbar.tsx               # Barre de navigation
│   │
│   └── types/                      # Types TypeScript
│       └── database.ts             # Types de la base de données
│
├── public/                         # Assets statiques
├── .env.local.example             # Exemple de configuration
├── next.config.js                 # Configuration Next.js
├── package.json                   # Dépendances
└── README.md                      # Ce fichier
```

---

## 📦 Dépendances Principales

| Dépendance | Version | Usage |
|------------|---------|-------|
| [Next.js](https://nextjs.org/) | ^14.2.3 | Framework React |
| [React](https://react.dev/) | ^18 | Bibliothèque UI |
| [TypeScript](https://www.typescriptlang.org/) | ^5 | Typage statique |
| [@supabase/supabase-js](https://supabase.com/) | ^2.39.0 | Base de données & Auth |
| [@supabase/ssr](https://supabase.com/) | ^0.3.0 | Supabase Server Components |
| [tailwindcss](https://tailwindcss.com/) | ^3.4.0 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | latest | Composants UI |
| [date-fns](https://date-fns.org/) | ^3.3.1 | Manipulation de dates |
| [lucide-react](https://lucide.dev/) | ^0.453.0 | Icônes |
| [zod](https://zod.dev/) | ^3.22.4 | Validation de données |
| [react-hook-form](https://react-hook-form.com/) | ^7.48.2 | Gestion de formulaires |

---

## ⚙️ Configuration

### Variables d'Environnement :

| Variable | Description | Requise | Valeur par défaut |
|----------|-------------|---------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme de Supabase | ✅ Oui | - |
| `BREVO_API_KEY` | Clé API de Brevo pour l'envoi d'emails | ⚠️ Optionnelle | - |
| `EMAIL_FROM` | Email expéditeur pour les notifications | ⚠️ Optionnelle | `Seconde Dressing <no-reply@brevo.com>` |
| `NEXT_PUBLIC_SITE_URL` | URL de votre site | ⚠️ Optionnelle | `http://localhost:3000` |

---

### Configuration de Brevo :

Pour activer l'envoi d'emails :

1. **Créer un compte** : [https://app.brevo.com](https://app.brevo.com)
2. **Créer une clé API** :
   - Allez dans **Paramètres > Clés API**
   - Créez une nouvelle clé **SMTP**
   - Copiez la clé dans `BREVO_API_KEY`
3. **Configurer l'email expéditeur** :
   - Allez dans **Paramètres > Expéditeurs & IP**
   - Ajoutez et vérifiez votre domaine/email
   - Configurez `EMAIL_FROM` avec cet email

---

## 🎯 Flux Utilisateur

### Inscription Client :
1. Page d'accueil → Sélection "Vendre mes vêtements" (Client)
2. Redirection vers `/signup` avec rôle pré-sélectionné
3. Remplissage du formulaire (email, mot de passe, nom, prénom, téléphone, adresse)
4. Validation et création du compte
5. Redirection vers la page d'accueil
6. Cliquer sur "Demande de RDV" dans la navbar
7. Remplir le formulaire de demande
8. Soumission et redirection vers le tableau de bord

### Inscription Vendeur :
1. Page d'accueil → Sélection "Aider à vendre" (Vendeur)
2. Redirection vers `/signup` avec rôle pré-sélectionné
3. Remplissage du formulaire
4. Validation et création du compte
5. Redirection vers `/vendeur` (espace vendeur)
6. Visualisation des demandes en attente
7. Accepter/Refuser les demandes
8. Mettre à jour le statut des demandes acceptées

### Connexion :
1. Cliquer sur "Se connecter" dans la navbar
2. Saisie de l'email et du mot de passe
3. Redirection automatique selon le rôle :
   - Client → `/` (accueil)
   - Vendeur → `/vendeur`

---

## 🏗️ Architecture Technique

### Frontend :
- **Next.js 14** avec App Router
- **TypeScript** pour le typage strict
- **ShadCN UI** pour les composants
- **Tailwind CSS** pour le styling
- **React Hook Form + Zod** pour la validation des formulaires

### Backend :
- **Supabase** (PostgreSQL) pour la base de données
- **Supabase Auth** pour l'authentification
- **Row Level Security (RLS)** pour la sécurité des données

### State Management :
- **React Context** pour l'état global
- **useState/useEffect** pour l'état local
- **Supabase Realtime** pour les mises à jour en temps réel

---

## 🎨 Bonnes Pratiques de Développement

### Architecture :
- **SOLID Principles** : Chaque classe a une responsabilité unique
- **Separation of Concerns** : Séparation claire entre UI, logique métier et données
- **Singleton Pattern** : Services partagés (email, Supabase) en singleton
- **Dependency Injection** : Injection de dépendances pour les tests

### Code Quality :
- **TypeScript** : Typage strict partout
- **ESLint & Prettier** : Formatage et linting cohérent
- **Clean Code** : Noms explicites, fonctions courtes, commentaires utiles
- **Error Handling** : Gestion d'erreurs robuste avec try/catch

### Sécurité :
- **Validation** : Toutes les entrées utilisateur sont validées (Zod)
- **Sanitization** : Échappement HTML pour éviter XSS
- **Authentification** : Supabase Auth avec JWT
- **Variables d'environnement** : Aucune clé sensible dans le code
- **RLS** : Row Level Security sur toutes les tables

### Performance :
- **Lazy Loading** : Chargement différé des composants lourds
- **Caching** : Mémoïsation des requêtes fréquentes
- **Optimized Build** : Bundle optimisé avec Next.js
- **Singleton Services** : Réutilisation des instances de services

---

## 🚀 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Construit l'application pour la production |
| `npm run lint` | Exécute le linting du code |
| `npm run lint:fix` | Corrige les erreurs de linting |
| `npm run format` | Formate le code avec Prettier |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/amazing-feature`)
3. **Faire vos modifications** avec des commits clairs
4. **Pousser** vos modifications (`git push origin feature/amazing-feature`)
5. **Ouvrir une Pull Request**

---

## 📜 Licence

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Le framework React
- [Supabase](https://supabase.com/) - La base de données open-source
- [Brevo](https://www.brevo.com/) - Le service d'email
- [shadcn/ui](https://ui.shadcn.com/) - Les composants UI
- [Tailwind CSS](https://tailwindcss.com/) - Le framework de styling

---

## ❓ Support

> **Seconde Dressing** - Vendre et acheter des vêtements d'occasion n'a jamais été aussi simple !

> **Contact** : contact@seconde-dressing.fr

> **Site Web** : [https://seconde-dressing.fr](https://seconde-dressing.fr)

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.3-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-2.39.0-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>
