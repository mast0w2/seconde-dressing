# Guide de Migration RLS - Second Dressing

## 📋 Vue d'ensemble

Ton backend a maintenant Row Level Security (RLS) activé. Cela signifie que les requêtes doivent **toujours** passer l'ID utilisateur authentifié pour que les policies de sécurité fonctionnent correctement.

**Les points clés:**
- ✅ Les utilisateurs peuvent voir uniquement LEURS données
- ✅ Les vendeurs peuvent voir les demandes qui les concernent
- ✅ Les clients peuvent voir leurs demandes
- ⚠️ Les requêtes doivent toujours préciser l'utilisateur connecté

---

## 🔄 Changements Nécessaires par Table

### 1. **profiles** - Profils utilisateurs

**Policy actuelle:**
- Chacun peut voir son propre profil
- Les utilisateurs authentifiés peuvent voir les profils des autres (pour affichage)
- Chacun peut modifier uniquement son profil
- Les vendeurs sont visibles aux utilisateurs anonymes (rôle public)

**Adaptation du code:** ✅ Déjà compatible

### 2. **requests** - Demandes de rendez-vous

**Policy actuelle:**
- Clients voient leurs propres demandes
- Vendeurs voient les demandes qui leur sont destinées
- Clients peuvent créer/modifier leurs demandes
- Vendeurs peuvent modifier les demandes qui les concernent

### 3. **availabilities** - Disponibilités des vendeurs

**Policy actuelle:**
- Vendeurs voient leurs propres disponibilités
- Clients voient les disponibilités de tous les vendeurs
- Vendeurs peuvent créer/modifier leurs propres disponibilités

### 4. **preferences** - Préférences utilisateur

**Policy actuelle:**
- Chacun ne peut voir/modifier que ses propres préférences

### 5. **reviews** - Avis

**Policy actuelle:**
- Tout le monde peut lire les avis
- Les utilisateurs authentifiés peuvent créer/modifier leurs avis

### 6. **contact_messages** - Messages de contact

**Policy actuelle:**
- Lecture publique (tout le monde)
- Création pour les utilisateurs authentifiés

### 7. **request_items** - Éléments des demandes

**Policy actuelle:**
- Accessibles aux clients et vendeurs impliqués dans la demande

### 8. **formulas** - Plans tarifaires

**Policy actuelle:**
- Lecture publique pour tous

---

## 🎯 Points Clés à Retenir

### ✅ RLS Fonctionne Automatiquement
Les requêtes Supabase ne nécessitent plus de filtrage manuel - RLS garantit la sécurité.

### ✅ Les Erreurs RLS Sont Normales (et Sûres)
Une erreur "row-level security" signifie que l'utilisateur n'a pas l'accès requis.

### ✅ Toujours Définir user_id ou client_id
Lors de l'insertion, les valeurs d'identification doivent être définiess.

---

**Pour plus de détails, consultez CHANGES_SUMMARY.md et FRONTEND_UPDATES_COMPLETE.md**
