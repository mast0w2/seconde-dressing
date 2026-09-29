// src/lib/brands.ts
//
// Détection de la marque dans la description d'une pièce.
//
// La vendeuse tape « Blouse Claudie Pierlot soie taille 38 » ; la colonne
// Marque se remplit toute seule avec « Claudie Pierlot ». C'est une
// suggestion, jamais une contrainte : ce qu'elle écrit dans la colonne prime
// toujours, et rien n'est écrasé.

/**
 * Marques rencontrées sur le segment de Seconde (seconde main féminine
 * parisienne, milieu et haut de gamme). Liste volontairement courte : une
 * marque de trop produit de faux positifs, une marque manquante coûte
 * seulement une saisie manuelle.
 */
export const MARQUES: string[] = [
  "& Other Stories",
  "Acne Studios",
  "Adidas",
  "American Vintage",
  "APC",
  "A.P.C.",
  "Arket",
  "Asos",
  "Balibaris",
  "Ba&sh",
  "Bash",
  "Bel Air",
  "Bershka",
  "Bizzbee",
  "Burberry",
  "Calvin Klein",
  "Camaieu",
  "Carhartt",
  "Claudie Pierlot",
  "Comptoir des Cotonniers",
  "COS",
  "Des Petits Hauts",
  "Diesel",
  "Etam",
  "Gap",
  "Gerard Darel",
  "Gérard Darel",
  "H&M",
  "Isabel Marant",
  "Jennyfer",
  "Jott",
  "Kookai",
  "Kookaï",
  "Lacoste",
  "Levis",
  "Levi's",
  "Leon & Harper",
  "Léon & Harper",
  "Mango",
  "Maje",
  "Mango",
  "Massimo Dutti",
  "Monoprix",
  "Nike",
  "Octobre Editions",
  "Patagonia",
  "Petit Bateau",
  "Pimkie",
  "Polo Ralph Lauren",
  "Promod",
  "Pull & Bear",
  "Ralph Lauren",
  "Reiko",
  "Rouje",
  "Sandro",
  "Sézane",
  "Sezane",
  "Stradivarius",
  "The Kooples",
  "Tommy Hilfiger",
  "Uniqlo",
  "Vanessa Bruno",
  "Veja",
  "Zadig & Voltaire",
  "Zara",
  "Weekday",
];

/** Minuscules, sans accents ni ponctuation : « Sézane » et « sezane » matchent. */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9&]+/g, " ")
    .trim();
}

// Les marques les plus longues d'abord : « Polo Ralph Lauren » doit gagner
// contre « Ralph Lauren », et « Claudie Pierlot » contre rien du tout.
const INDEX = MARQUES.map((nom) => ({ nom, cle: normaliser(nom) })).sort(
  (a, b) => b.cle.length - a.cle.length
);

/**
 * Marque reconnue dans un texte, ou null.
 *
 * La comparaison se fait sur des mots entiers : « cosy » ne déclenche pas
 * « COS », et « zarafa » ne déclenche pas « Zara ».
 */
export function detecterMarque(texte: string | null | undefined): string | null {
  if (!texte) return null;
  const cible = ` ${normaliser(texte)} `;
  for (const { nom, cle } of INDEX) {
    if (cible.includes(` ${cle} `)) return nom;
  }
  return null;
}
