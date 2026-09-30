// src/lib/secteur.ts
//
// Réduit une adresse à son secteur, pour les écrans où l'on n'a pas à savoir
// où habite précisément quelqu'un.
//
// Une demande non attribuée est visible par toutes les vendeuses approuvées.
// Leur donner « 12 rue Machin, 75017 Paris » revient à livrer le domicile
// d'une cliente à des gens qui ne s'occuperont peut-être jamais d'elle, alors
// qu'elles n'ont besoin que d'une chose pour décider : est-ce que c'est dans
// mon secteur ? L'adresse complète n'apparaît qu'après acceptation.

const CODE_POSTAL = /\b(\d{5})\b/;

/**
 * « 12 rue Lemercier 75017 Paris » -> « Paris 17e »
 * « 4 av. du Général 92100 Boulogne-Billancourt » -> « Boulogne-Billancourt (92) »
 *
 * Renvoie null si aucun code postal n'est reconnaissable : mieux vaut ne rien
 * afficher qu'un fragment d'adresse choisi au hasard.
 */
export function secteur(adresse: string | null | undefined): string | null {
  if (!adresse) return null;

  const trouve = adresse.match(CODE_POSTAL);
  if (!trouve) return null;

  const code = trouve[1];

  // Paris intra-muros : 75001 à 75020.
  if (code.startsWith("75")) {
    const arrondissement = Number(code.slice(3));
    if (arrondissement >= 1 && arrondissement <= 20) {
      return `Paris ${arrondissement}${arrondissement === 1 ? "er" : "e"}`;
    }
  }

  // Ailleurs : la commune et son département. Le nom de la commune suit le
  // code postal dans une adresse écrite normalement.
  const apres = adresse.slice((trouve.index ?? 0) + code.length).trim();
  const commune = apres.split(/[,\n]/)[0].trim();
  const departement = code.slice(0, 2);

  return commune ? `${commune} (${departement})` : `Département ${departement}`;
}
