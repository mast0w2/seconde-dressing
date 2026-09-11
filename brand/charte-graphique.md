# Charte graphique — Seconde

Document de référence pour toute nouvelle page, fonctionnalité ou communication. Il décrit l'identité telle qu'elle est effectivement implémentée dans le code du site (Next.js + Tailwind). Toute IA ou personne qui développe une nouvelle feature doit s'y conformer.

---

## 1. Positionnement et ton

Seconde est une conciergerie de seconde main : on vient chercher le dressing des client·es chez elles, on trie, on photographie, on vend, elles touchent une part de chaque vente.

L'identité doit dire **chaleureux, humain, responsable** — jamais froid, technologique ou « startup ». Le fil rouge : *une équipe, pas un algorithme*.

**Ton d'écriture**
- Vouvoiement, phrases courtes, concrètes.
- On parle du bénéfice, pas de la technique : « Vous n'avez rien à gérer » plutôt que « plateforme automatisée ».
- Pas de superlatifs marketing, pas de jargon, pas de points d'exclamation en rafale.
- L'humain est toujours présent dans les formulations : « on vient chercher », « chaque pièce passe entre nos mains ».
- Exemples validés : « On vous aide à vendre vos vêtements, donnez-leur une seconde vie. » · « Confiez-nous vos vêtements, on s'occupe du reste. » · « Cinq étapes, et c'est réglé. »

---

## 2. Couleurs

### Palette

| Rôle | Hex | Usage |
|---|---|---|
| **Vert forêt** | `#2e3a2c` | Couleur principale : texte, boutons pleins, sections foncées |
| **Vert forêt foncé** | `#23301e` | Survol des éléments vert forêt |
| **Vert de texte secondaire** | `#5c6653` | Paragraphes, textes d'accompagnement |
| **Crème** | `#f4f1ea` | Fond principal du site, texte sur fond vert |
| **Crème rompu** | `#ede9df` | Fond des sections alternées (ex. « Notre concept ») |
| **Blanc cassé** | `#faf8f3` | Fond des cartes |
| **Sauge** | `#8b9a7a` | Accent : icônes, cœur du logo, surtitres |
| **Sauge clair** | `#c7d0b7` | Formes organiques derrière les photos, filets, accents sur fond foncé |
| **Sauge foncé** | `#6f7d62` | Liens, italiques mises en valeur, petites capitales |
| **Bordures** | `#e2ddd0` / `#e6e1d4` | Filets, séparateurs, contours de cartes |

Aucun noir pur (`#000`) ni blanc pur (`#fff`) dans l'interface : tout passe par le vert forêt et le crème.

### Noms des tokens dans le code — attention

Les tokens Tailwind ont gardé leurs **anciens noms** issus de la charte précédente, mais contiennent désormais les **nouvelles valeurs**. Il faut donc lire `noir` comme « vert forêt » et `blanc` comme « crème ».

| Classe Tailwind | Valeur réelle |
|---|---|
| `noir` | `#2e3a2c` vert forêt |
| `gris-fonce` | `#23301e` |
| `gris-moyen` | `#5c6653` |
| `gris-clair` | `#ede9df` |
| `gris-tres-clair` | `#faf8f3` |
| `blanc` | `#f4f1ea` crème |
| `beige` | `#faf8f3` |
| `creme` | `#f4f1ea` |
| `sauge` | `#8b9a7a` |
| `sauge-clair` | `#c7d0b7` |
| `sauge-fonce` | `#6f7d62` |
| `foret` | `#2e3a2c` |

Exemples : `text-noir` = texte vert forêt · `bg-blanc` = fond crème · `text-sauge` = icône sauge.

Les composants shadcn/ui (`Button`, `Card`, `Input`…) utilisent les variables sémantiques HSL définies dans `src/app/globals.css` (`--background`, `--foreground`, `--primary`, `--border`…), déjà alignées sur cette palette. Ne pas les redéfinir localement.

### Répartition recommandée

Environ 70 % de crème (fond), 20 % de vert forêt (texte et blocs forts), 10 % de sauge (accents). Le sauge est un condiment : il ponctue, il ne structure pas.

---

## 3. Typographie

Deux polices, toutes deux libres et gratuites sur Google Fonts, chargées via `next/font/google` dans `src/app/layout.tsx`.

| Police | Rôle | Graisses chargées |
|---|---|---|
| **Cormorant Garamond** | Titres, chiffres d'étapes, citations, logo | 300, 400, 500, 600, 700 + italiques |
| **Jost** | Texte courant, boutons, navigation, formulaires, surtitres | 300, 400, 500, 600 |

### Échelle

| Élément | Taille desktop | Police | Détails |
|---|---|---|---|
| `h1` | 48–56px | Cormorant Garamond 400 | Interligne 1.12, jamais en gras |
| `h2` | 36–42px | Cormorant Garamond 400 | Interligne 1.18 |
| `h3` | 24–26px | Cormorant Garamond 500 | |
| Corps de texte | 17px | Jost 400 | Interligne 1.75, couleur `#5c6653` |
| Petit texte | 14–15px | Jost 400 | |
| Surtitre (`.eyebrow`) | 10px | Jost 400 | Majuscules, interlettrage 0.26em, couleur sauge |
| Bouton | 11px | Jost 500 | Majuscules, interlettrage 0.2em |
| Chiffres d'étapes | 34px | Cormorant Garamond 400 | Format « 01 », couleur sauge clair |

Règles : les titres ne sont **jamais** en gras ni en majuscules (l'élégance vient du serif, pas du poids). Les majuscules sont réservées aux surtitres, boutons et micro-labels, toujours avec un fort interlettrage.

Une mise en valeur fréquente : la deuxième ligne d'un titre en *italique* couleur sauge foncé (`#6f7d62`).

---

## 4. Logo

Le logo est un cintre au trait fin portant une étiquette avec un cœur sauge, accompagné du mot « seconde » en Cormorant Garamond bas de casse.

- Dans le site : composant `src/components/Logo.tsx`, props `layout="stack"` (cintre au-dessus du mot, utilisé dans le header et le footer) ou `layout="row"`.
- Déclinaisons pour l'externe : dossier `brand/logo/` du dépôt — 4 mises en page (vertical, horizontal, icône, mot) × 6 déclinaisons de couleur, en SVG et PNG. Voir le `README.md` du dossier pour les règles d'usage.
- Zone de protection : un espace vide au moins égal à la hauteur du cintre autour du logo.
- Taille minimale : 24px pour l'icône seule, 40px pour les versions avec le mot.
- Interdits : déformer, recolorer hors palette, ajouter une ombre, modifier l'espacement interne, poser la version verte sur fond foncé.

---

## 5. Mise en page

- Largeur maximale du contenu : `1200px`, centrée.
- Marges latérales : `24px` mobile → `40px` tablette → `76px` desktop (`px-6 sm:px-10 lg:px-[76px]`).
- Espacement vertical des sections : `64px` mobile → `80px` → `96px` desktop (`py-16 sm:py-20 lg:py-24`).
- Alternance des fonds pour rythmer la page : crème → crème rompu → crème → vert forêt → crème.
- Grilles à deux colonnes asymétriques (`1fr` + colonne fixe de 400–470px) pour les blocs texte + image ; grille de 3 colonnes pour les cartes.
- Angles : rayon par défaut `6px`, boutons à angles droits (`rounded-none`). Pas d'ombres portées, sauf une ombre très douce au survol des cartes.

---

## 6. Composants

**Boutons principaux** — fond vert forêt, texte crème, angles droits, libellé en majuscules 11px interlettré 0.2em, padding généreux (`px-8 py-6`). Au survol : fond transparent, texte vert forêt, bordure conservée.

**Boutons secondaires** — fond transparent, bordure et texte vert forêt ; au survol, inversion.

**Cartes** — fond `#faf8f3`, bordure 1px `#e6e1d4`, padding 32px, pas d'ombre au repos. Structure : icône sauge (trait 1.4px, 28px) → titre `h3` → texte gris-moyen.

**Icônes** — bibliothèque `lucide-react`, trait fin (`strokeWidth={1.3}` à `1.4`), couleur sauge, taille 28px dans les cartes. Jamais d'icône pleine ni multicolore.

**Champs de formulaire** — bordure basse uniquement, sans fond, focus qui passe la bordure en sauge. Labels en petites majuscules Jost.

**Filets décoratifs** — trait 1px `#b9c0ad` de 46px, souvent suivi d'un micro-label en majuscules sauge foncé.

---

## 7. Photographie

Style validé : **appartement parisien chaleureux**. Parquet point de Hongrie, moulures, lumière naturelle douce de fin d'après-midi, tons crème, sauge, bois clair, terracotta en touche. Scènes de vie réelles et non posées : mains qui plient, portants, penderies, remise d'un sac sur le palier.

À proscrire : lumière froide, fonds blancs de studio, sourires figés type banque d'images, couleurs saturées, tout ce qui « fait IA » (mains déformées, peau lissée, perspectives impossibles).

**Traitement dans les pages** : les photos sont détourées par des arrondis organiques (ex. `rounded-[235px_235px_16px_16px]` — arche en haut, angles doux en bas) avec une forme sauge clair décalée derrière (`bg-sauge-clair/45`) qui les ancre dans la palette.

**Qualité technique** : minimum 1200px sur le petit côté, idéalement 2000px, exportées en JPEG qualité 90 progressif. Une image de moins de 150 Ko affichée en grand sera floue sur écran Retina.

---

## 8. Où ça vit dans le code

| Fichier | Contenu |
|---|---|
| `tailwind.config.js` | Tokens de couleur et familles de police |
| `src/app/globals.css` | Variables CSS, styles de base des titres et paragraphes, classes `.eyebrow`, `.btn-primary`, `.card-cezanne`, `.form-input-cezanne` |
| `src/app/layout.tsx` | Chargement des polices Cormorant Garamond et Jost |
| `src/components/Logo.tsx` | Composant logo (mise en page empilée ou en ligne) |
| `src/app/page.tsx` | Page d'accueil — référence de mise en œuvre de toute la charte |
| `brand/logo/` | Déclinaisons du logo pour les usages externes |
| `public/favicon.svg` | Favicon |

**Pour développer une nouvelle page** : partir de `src/app/page.tsx` comme modèle de référence, réutiliser les tokens Tailwind existants (jamais de valeur hex écrite en dur dans un composant), respecter l'échelle typographique ci-dessus et l'alternance des fonds.
