# 🚀 CI/CD Configuration - Seconde Dressing

## Vue d'ensemble

Ce projet utilise **GitHub Actions** pour automatiser:
- ✅ **Tests** - Sur chaque push/PR vers main ou develop
- ✅ **Linting** - Vérification ESLint
- ✅ **Build** - Compilation Next.js
- ✅ **E2E Tests** - Tests Playwright
- ✅ **Deploy** - Déploiement en production sur Vercel

---

## 📋 Workflows GitHub Actions

### 1️⃣ `tests.yml` - Tests & Linting (Dev)

**Déclenché par:**
- Push vers `main` ou `develop`
- Pull requests vers `main` ou `develop`

**Étapes:**
1. ✅ Linting (ESLint)
2. ✅ Tests unitaires (Jest)
3. ✅ Tests E2E (Playwright)
4. ✅ Build (Next.js)
5. 📊 Upload coverage reports

**Duration:** ~5-10 minutes

---

### 2️⃣ `deploy.yml` - Deploy to Production

**Déclenché par:**
- Push vers `main`
- Déploiement manuel (workflow_dispatch)

**Conditions:**
- ✅ Tous les tests doivent passer
- ✅ Build doit réussir
- ❌ Déploiement bloqué si tests échouent

**Étapes:**
1. ✅ Exécuter tous les tests
2. ✅ Vérifier la build
3. 🚀 Déployer vers Vercel Production
4. 📝 Commenter la PR avec status

**Duration:** ~10-15 minutes

---

## 🔐 Secrets GitHub Requis

### Pour tous les workflows:

```bash
NEXT_PUBLIC_SUPABASE_URL      # URL Supabase (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY # Clé anon Supabase (public)
```

### Pour déploiement production:

```bash
VERCEL_TOKEN       # Token d'authentification Vercel
VERCEL_ORG_ID      # ID de l'organisation Vercel
VERCEL_PROJECT_ID  # ID du projet Vercel
```

---

## 📝 Configuration des Secrets

### Étape 1: Aller sur GitHub
1. Va sur ton repo: `https://github.com/mast0w2/seconde-dressing`
2. Clique sur **Settings** (⚙️)
3. Clique sur **Secrets and variables** → **Actions**

### Étape 2: Ajouter les secrets

Clique sur **"New repository secret"** et ajoute:

#### Secrets Supabase (publics, mais à ajouter pour la pipeline)
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Secrets Vercel (pour déploiement)
```
Name: VERCEL_TOKEN
Value: [Génère depuis Vercel → Settings → Tokens]

Name: VERCEL_ORG_ID
Value: [Trouve dans Vercel → Settings → General]

Name: VERCEL_PROJECT_ID
Value: [Trouve dans Vercel → Settings → General]
```

---

## 📊 Voir les résultats des workflows

### Sur GitHub:
1. Va sur ton repo
2. Clique sur l'onglet **"Actions"**
3. Clique sur le workflow que tu veux voir
4. Clique sur le commit/run spécifique

### Dans les logs:
- ✅ **Tests passed:** Voir les résultats détaillés
- ❌ **Tests failed:** Vérifier les erreurs et les corriger
- 📈 **Coverage reports:** Sur Codecov

---

## 🔄 Stratégie de Branches

### `develop`
- Branch de développement
- Tests automatiques à chaque push
- Déploiement manuel sur préproduction
- Pas de déploiement auto en prod

### `main`
- Branch de production
- Tests automatiques à chaque push
- **Déploiement automatique en production** ✅
- Protégée: merge via PR avec tests passants

---

## ⚙️ Règles de Branche Protégées

Pour protéger `main`, va sur:
**Settings → Branches → Branch protection rules**

Configuration recommandée:
```
✅ Require status checks to pass before merging
   - actions/lint-and-test
   - actions/e2e-tests
   - actions/build

✅ Require branches to be up to date before merging

✅ Require pull request reviews before merging (optional)

✅ Dismiss stale pull request approvals when new commits are pushed
```

---

## 🚨 Troubleshooting

### ❌ Tests échouent
1. Vérifier les logs sur GitHub Actions
2. Lancer les tests localement: `npm test`
3. Corriger les erreurs
4. Pusher les corrections

### ❌ Build échoue
1. Vérifier les logs: `npm run build`
2. Vérifier les variables d'environnement
3. Corriger et repusher

### ❌ Déploiement échoue
1. Vérifier les secrets Vercel
2. Vérifier la connexion GitHub ↔ Vercel
3. Vérifier les logs Vercel

---

## 📚 Commandes Locales (équivalent aux workflows)

```bash
# Linting (équivalent à ESLint job)
npm run lint

# Tests unitaires (équivalent à Jest job)
npm test

# Tests E2E (équivalent à Playwright job)
npm run test:e2e

# Build (équivalent à build job)
npm run build

# Tous les tests (équivalent au workflow complet)
npm run test:all
```

---

## 🎯 Flux de Déploiement

```
1. Feature branch
   ↓
2. Créer PR vers develop
   ↓
3. Tests automatiques sur PR
   ✅ Si réussi: peut merger
   ❌ Si échoue: corriger et repusher
   ↓
4. Merge dans develop
   ↓
5. Tests automatiques sur develop
   ↓
6. (Optionnel) Créer PR de develop → main
   ↓
7. Push vers main
   ↓
8. Tests automatiques sur main
   ↓
9. 🚀 Déploiement automatique en production!
```

---

## 📞 Assistance

Si un workflow échoue:
1. Vérifier les logs GitHub Actions
2. Lancer les commandes localement
3. Corriger le problème
4. Repusher et vérifier que le workflow réussit

C'est tout! La CI/CD est maintenant en place! 🎉
