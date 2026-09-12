# Pré-rendu SEO (Server-Side Generation)

Ce document explique comment le pré-rendu (SSG) a été mis en place sur `seconde-dressing.com`
pour que le HTML servi contienne déjà tout le texte visible, les balises SEO et les données
structurées, sans attendre l'exécution du JavaScript côté client.

## Diagnostic

Le site est une application **Next.js 14 (App Router)**, et non une SPA Vite/CRA.

Le HTML servi était vide (`<div id="root"></div>` / `<body>` sans contenu) à cause d'une
seule ligne dans `src/app/layout.tsx` :

```ts
export const dynamic = 'force-dynamic';
```

Cette directive forçait **toutes les routes** à être rendues dynamiquement à la volée par
un serveur Node à chaque requête. Aucun fichier HTML statique n'était généré au build
(`.next/server/app/*.html` était absent), ce qui rend le contenu invisible pour les
robots d'indexation sur un hébergement statique.

## Solution appliquée

1. **Suppression de `force-dynamic`** dans `src/app/layout.tsx`. Next.js pré-rend maintenant
   toutes les pages en HTML statique au build (`next build`). Aucun serveur Node n'est
   nécessaire pour servir le contenu visible.

2. **Métadonnées par route.** Comme les pages existantes sont des composants client
   (`"use client"`) et que Next.js n'autorise pas `export const metadata` dans un
   composant client, chaque page client a été renommée en `*Page.tsx` et un fin
   wrapper serveur `page.tsx` exporte la `metadata` et affiche le composant client.
   Les composants, styles et le routage existants sont **intacts**.

3. **Centralisation SEO** dans `src/lib/seo.ts` :
   - `buildPageMetadata()` génère `title`, `description`, `canonical`,
     Open Graph et Twitter Card par route.
   - `buildJsonLd()` produit les données structurées schema.org (`Service`).

4. **Layout racine enrichi** : `metadataBase`, titre/description par défaut, OG/Twitter
   globaux, `robots.index/follow`, et un bloc `<script type="application/ld+json">`
   injecté dans le HTML pré-rendu.

5. **`robots.txt`** (`src/app/robots.ts`) : autorise tout, bloque `/api/` et `/admin/`,
   déclare le sitemap.

6. **`sitemap.xml`** (`src/app/sitemap.ts`) : liste toutes les routes publiques pré-rendues.

## Vérification

Après `npm run build` :

- Le HTML de chaque route contient le texte visible. Exemple dans le HTML de la page
  d'accueil : on retrouve directement « Confiez-nous vos vêtements », « Pourquoi choisir
  Seconde », « On vous aide à vendre vos vêtements ».
- Chaque page contient `<title>`, `<meta name="description">`, `<link rel="canonical">`,
  les balises Open Graph / Twitter Card et un bloc `application/ld+json`.
- Les pages restent interactives : React s'hydrate côté client, le routing React/Next
  fonctionne en navigation client.
- `robots.txt` et `sitemap.xml` sont générés à la racine de la sortie du build.

## Variables d'environnement requises au build

Le pré-rendu exécute le rendu des composants. Plusieurs pages instancient le client
Supabase (`createBrowserClient`) au montage ; l'URL Supabase doit donc être une URL HTTP/HTTPS
valide **au moment du build**, sinon `next build` échoue avec
`Error: Invalid supabaseUrl`.

Assurez-vous que `.env.local` (ou les variables d'environnement du CI) contient des valeurs
valides pour :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-clé-anon>
NEXT_PUBLIC_SITE_URL=https://seconde-dressing.com
```

`NEXT_PUBLIC_SITE_URL` est utilisé pour générer les URL canoniques, Open Graph, le
sitemap et le robots.txt. En production, indiquez l'URL publique du site.

## Optimisations SEO avancées

Au-delà du pré-rendu, les signaux SEO suivants ont été ajoutés :

- **Données structurées multi-types sur l'accueil** : `Service` + `Organization` + `WebSite`
  (trois blocs `application/ld+json` dans le HTML pré-rendu) pour décrire le service,
  l'organisation et le site aux moteurs.
- **`BreadcrumbList` par sous-page** (`/concept`, `/about`, `/impact`, `/contact`,
  `/demande-rdv`, `/reviews`) : fil d'Ariane schema.org pré-rendu, affichable dans les
  résultats de recherche.
- **Avis clients (`AggregateRating` + `Review`)** sur `/reviews` : injectés côté client
  après chargement des avis (données dynamiques depuis Supabase). Google exécute le JS
  et indexe les étoiles et les avis individuels — signal fort pour les SERP.
- **`noindex, nofollow` sur les pages privées** (`/dashboard`, `/dashboard/client`,
  `/dashboard/vendeur`, `/profile`, `/preferences`) : ces pages ne doivent pas être
  indexées. Doublement protégé via `robots` meta + `robots.txt` (`disallow`).
- **`robots.txt` élargi** : bloque désormais `/api/`, `/admin/`, `/dashboard/`,
  `/profile`, `/preferences`.

## Note sur l'hébergement

`next build` produit des pages pré-rendues (HTML statique) **et** des routes API
dynamiques (`/api/*`) + un middleware d'authentification qui nécessitent un runtime Node
au serveur (Vercel, Netlify Functions). Les pages SEO sont entièrement statiques et
indexables ; les API routes et le middleware ne le sont pas et ne doivent pas l'être.

Si vous souhaitez un export **100% statique** (dossier `out/` servi tel quel sur S3 /
GitHub Pages / hébergement purement statique), activez `output: 'export'` dans
`next.config.js`. **Attention** : cela désactiverait les 12 routes API
(`/api/contact`, `/api/auth/*`, etc.) et le middleware d'authentification, qui ne
fonctionnent pas en export statique. C'est un changement d'architecture plus important,
non couvert par cette itération afin de préserver les fonctionnalités existantes.

## Liste des routes pré-rendues

`/`, `/concept`, `/about`, `/impact`, `/contact`, `/vendeur`, `/demande-rdv`,
`/reviews`, `/login`, `/signup`, `/forgot-password`, `/dashboard`,
`/dashboard/client`, `/dashboard/vendeur`, `/profile`, `/preferences`.
