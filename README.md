# Seconde Dressing

> **Seconde Dressing** est une plateforme de mise en relation entre clients et vendeuses professionnelles pour la vente de vtements d'occasion. Ce projet est construit avec Next.js 14, TypeScript, et Supabase pour offrir une exprience utilisateur fluide et scurise.

---

## [32m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m✨ [38;5;226mFonctionnalités [38;5;220m  [38;5;196m✨[39m

### [38;5;39mPour les Clients :[39m
- [38;5;40m✓[39m Cration de compte et gestion de profil
- [38;5;40m✓[39m Recherche et slection de vendeuses
- [38;5;40m✓[39m Prise de rendez-vous en ligne
- [38;5;40m✓[39m Suivi des rendez-vous et historique
- [38;5;40m✓[39m Soumission d'avis et notation

### [38;5;39mPour les Vendeuses :[39m
- [38;5;40m✓[39m Gestion de profil professionnel
- [38;5;40m✓[39m Configuration des disponibilits
- [38;5;40m✓[39m Rception et gestion des demandes de RDV
- [38;5;40m✓[39m Acceptation/Refus des rendez-vous
- [38;5;40m✓[39m Tableau de bord avec statistiques

### [38;5;39mFonctionnalités Système :[39m
- [38;5;40m✓[39m Système de notification par email (Brevo)
- [38;5;40m✓[39m Authentification scurisee (Supabase Auth)
- [38;5;40m✓[39m Gestion des formulaires de contact
- [38;5;40m✓[39m Design responsive (Mobile-first)
- [38;5;40m✓[39m Interface multilingue (Franais)

---

## [34m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m🚀 [38;5;226mDémarrage Rapide [38;5;220m  [38;5;196m🚀[39m

### [38;5;39mPrérequis :[39m

- [Node.js](https://nodejs.org/) v18.17 ou supérieur
- [npm](https://www.npmjs.com/) v9 ou supérieur (ou [yarn](https://yarnpkg.com/))
- [Git](https://git-scm.com/)
- Un compte [Supabase](https://supabase.com/) (pour la base de données et l'authentification)
- Un compte [Brevo](https://www.brevo.com/) (pour l'envoi d'emails)

---

### [38;5;39m1. Cloner le dépôt :[39m

```bash
# HTTPS
git clone https://github.com/mast0w2/seconde-dressing.git
cd seconde-dressing

# ou SSH
git clone git@github.com:mast0w2/seconde-dressing.git
cd seconde-dressing
```

---

### [38;5;39m2. Installer les dépendances :[39m

```bash
# Avec npm
npm install

# Avec yarn
# yarn install
```

> [33m⚠️[39m **Note** : L'installation peut prendre quelques minutes selon votre connexion internet.

---

### [38;5;39m3. Configurer les variables d'environnement :[39m

Copiez le fichier d'exemple et configurez vos variables :

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Ou créer un nouveau fichier
nano .env.local  # ou utilisez votre éditeur préféré
```

#### [38;5;39mVariables requises dans `.env.local` :[39m

```env
# ============================================================================
# Supabase Configuration (Required)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ============================================================================
# Brevo (Sendinblue) Email Service (Required for email functionality)
# ============================================================================
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM="Seconde Dressing <no-reply@your-domain.com>"

# ============================================================================
# Application Configuration
# ============================================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### [38;5;39mOù trouver ces informations :[39m

| Variable | Source | Comment l'obtenir |
|----------|--------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Paramtres > API > URL du projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Paramtres > API > Cl anonyme |
| `BREVO_API_KEY` | [Brevo Dashboard](https://app.brevo.com) | Paramtres > Cls API > Crer une cl SMTP |
| `EMAIL_FROM` | Votre domaine | Email vrifi dans Brevo |

---

### [38;5;39m4. Configurer Supabase :[39m

1. **Créer un projet Supabase** : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Créer les tables** : Exécutez les requêtes SQL suivantes dans l'interface SQL de Supabase :

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  photo_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'vendeuse')),
  bio TEXT,
  specialisation TEXT,
  tarif_horaire NUMERIC,
  annees_experience INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disponibilites table
CREATE TABLE IF NOT EXISTS disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut TEXT NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'reserve')),
  est_recurrent BOOLEAN DEFAULT FALSE,
  jour_recurrence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rendez-vous table
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendeuse_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disponibilite_id UUID NOT NULL REFERENCES disponibilites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse', 'annule')),
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mis_a_jour_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preferences table
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  langue TEXT NOT NULL DEFAULT 'FR' CHECK (langue IN ('FR', 'EN')),
  theme TEXT NOT NULL DEFAULT 'clair' CHECK (theme IN ('clair', 'sombre')),
  notifications_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Configurer l'authentification** :
   - Allez dans **Auth > Paramtres**
   - Activez **Email/Password** auth
   - Activez **Email confirmations**
   - Configurez votre **Site URL** : `http://localhost:3000` (ou votre URL de production)

---

### [38;5;39m5. Démarrer l'application :[39m

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera disponible à l'adresse : [http://localhost:3000](http://localhost:3000)

---

## [36m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m📁 [38;5;226mStructure du Projet [38;5;220m  [38;5;196m📁[39m

```
seconde-dressing/
├── src/
│   ├── app/                          # Pages et API routes
│   │   ├── api/                      # API endpoints
│   │   │   ├── auth/                 # Authentification
│   │   │   ├── contact/              # Formulaire de contact
│   │   │   ├── notifications/        # Notifications email
│   │   │   ├── reviews/              # Avis clients
│   │   │   └── ...                  # Autres endpoints
│   │   ├── client/                   # Pages client
│   │   ├── vendeuse/                # Pages vendeuse
│   │   └── ...                      # Autres pages
│   │
│   ├── components/                  # Composants React
│   │   ├── ui/                      # Composants UI (shadcn/ui)
│   │   └── Form/                    # Formulaires
│   │
│   ├── lib/                        # Bibliothèques et services
│   │   ├── email.ts                 # Service email (Brevo)
│   │   ├── supabase/               # Configuration Supabase
│   │   └── utils.ts                # Utilitaires
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

## [35m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m📦 [38;5;226mDépendances Principales [38;5;220m  [38;5;196m📦[39m

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

## [31m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m⚙️ [38;5;226mConfiguration [38;5;220m  [38;5;196m⚙️[39m

### [38;5;39mVariables d'Environnement :[39m

| Variable | Description | Requise | Valeur par défaut |
|----------|-------------|---------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme de Supabase | ✅ Oui | - |
| `BREVO_API_KEY` | Clé API de Brevo pour l'envoi d'emails | ⚠️ Optionnelle | - |
| `EMAIL_FROM` | Email expéditeur pour les notifications | ⚠️ Optionnelle | `Seconde Dressing <no-reply@brevo.com>` |
| `NEXT_PUBLIC_SITE_URL` | URL de votre site | ⚠️ Optionnelle | `http://localhost:3000` |

---

### [38;5;39mConfiguration de Brevo :[39m

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

## [32m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m🎯 [38;5;226mBonnes Pratiques de Développement [38;5;220m  [38;5;196m🎯[39m

### [38;5;39mArchitecture :[39m
- **SOLID Principles** : Chaque classe a une responsabilité unique
- **Separation of Concerns** : Séparation claire entre UI, logique métier et données
- **Singleton Pattern** : Services partagés (email, Supabase) en singleton
- **Dependency Injection** : Injection de dépendances pour les tests

### [38;5;39mCode Quality :[39m
- **TypeScript** : Typage strict partout
- **ESLint & Prettier** : Formatage et linting cohérent
- **Clean Code** : Noms explicites, fonctions courtes, commentaires utiles
- **Error Handling** : Gestion d'erreurs robuste avec try/catch

### [38;5;39mSécurité :[39m
- **Validation** : Toutes les entrées utilisateur sont validées (Zod)
- **Sanitization** : Échappement HTML pour éviter XSS
- **Authentification** : Supabase Auth avec JWT
- **Variables d'environnement** : Aucune clé sensible dans le code

### [38;5;39mPerformance :[39m
- **Lazy Loading** : Chargement différé des composants lourds
- **Caching** : Mémoïsation des requêtes fréquentes
- **Optimized Build** : Bundle optimisé avec Next.js
- **Singleton Services** : Réutilisation des instances de services

---

## [34m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m🚀 [38;5;226mScripts Disponibles [38;5;220m  [38;5;196m🚀[39m

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Construit l'application pour la production |
| `npm start` | Démarre le serveur de production |
| `npm run lint` | Exécute le linting du code |
| `npm run lint:fix` | Corrige les erreurs de linting |
| `npm run format` | Formate le code avec Prettier |

---

## [36m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m🤝 [38;5;226mContribution [38;5;220m  [38;5;196m🤝[39m

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/amazing-feature`)
3. **Faire vos modifications** avec des commits clairs
4. **Pousser** vos modifications (`git push origin feature/amazing-feature`)
5. **Ouvrir une Pull Request**

---

## [31m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m📜 [38;5;226mLicence [38;5;220m  [38;5;196m📜[39m

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---

## [33m[1m[4m[24m[39m[22m[39m[22m

## 0[38;5;208m[38;5;214m[39m[38;5;220m  [38;5;196m🙏 [38;5;226mRemerciements [38;5;220m  [38;5;196m🙏[39m

- [Next.js](https://nextjs.org/) - Le framework React
- [Supabase](https://supabase.com/) - La base de données open-source
- [Brevo](https://www.brevo.com/) - Le service d'email
- [shadcn/ui](https://ui.shadcn.com/) - Les composants UI
- [Tailwind CSS](https://tailwindcss.com/) - Le framework de styling

---

## [38;5;202m[38;5;208m[38;5;214m[38;5;220m[38;5;226m✨[39m

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
