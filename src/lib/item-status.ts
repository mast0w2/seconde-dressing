// src/lib/item-status.ts
//
// Vocabulaire et couleurs des statuts d'une pièce d'inventaire.
//
// Deux vocabulaires pour les mêmes états : celui de la vendeuse, qui parle de
// son travail, et celui de la cliente, qui ne veut savoir qu'une chose — où en
// est sa pièce et quand elle est payée. Les deux vivent ici pour qu'on ne
// puisse pas les faire diverger par inadvertance.
//
// COULEURS : cinq teintes franchement distinctes, mais toutes désaturées — un
// tableau d'inventaire se lit toute la journée, il ne doit pas crier. Chaque
// statut a sa famille de couleur, pour qu'on les distingue d'un coup d'œil
// sans lire l'étiquette :
//   gris = rien n'est encore en jeu · ocre = en cours · vert = vendu
//   bleu = argent versé · terre cuite = ne partira pas

import type { ItemStatus } from "@/types/database";

export interface StatutInfo {
  /** Libellé côté vendeuse. */
  label: string;
  /** Libellé côté cliente : ce qu'elle a besoin de comprendre. */
  labelCliente: string;
  fond: string;
  texte: string;
  bordure: string;
}

export const STATUTS: Record<ItemStatus, StatutInfo> = {
  photos_taken: {
    label: "Photos prises",
    labelCliente: "Prête à être mise en vente",
    fond: "#eceae4",
    texte: "#5b584f",
    bordure: "#cfcabd",
  },
  on_sale: {
    label: "Vente en cours",
    labelCliente: "En vente",
    fond: "#f5e7cd",
    texte: "#7a5c1f",
    bordure: "#d8bd85",
  },
  sold: {
    label: "Vendu",
    labelCliente: "Vendue — paiement en cours",
    fond: "#d2e2c4",
    texte: "#3b5029",
    bordure: "#7e9468",
  },
  finalized: {
    label: "Finalisé",
    labelCliente: "Vendue — vous avez été payée",
    fond: "#dbe4ec",
    texte: "#364a5c",
    bordure: "#8ba3b8",
  },
  unsellable: {
    label: "Invendable",
    labelCliente: "Invendable",
    fond: "#f0ded6",
    texte: "#7a4a37",
    bordure: "#cda894",
  },
};

/** Ordre d'affichage dans le menu déroulant et dans le tri par statut. */
export const ORDRE_STATUTS: ItemStatus[] = [
  "photos_taken",
  "on_sale",
  "sold",
  "finalized",
  "unsellable",
];

/**
 * Statuts proposés dans le menu déroulant.
 *
 * Deux états n'y figurent pas, parce qu'ils s'obtiennent par un geste explicite
 * et pas par un choix dans une liste :
 *   * « Vendu » demande un prix de vente — bouton dédié dans la colonne Vendu ;
 *   * « Finalisé » demande un justificatif de virement et verrouille la ligne
 *     pour de bon — il découle du dépôt de la preuve de vente.
 *
 * Le statut courant reste toujours proposé, sinon le menu afficherait du vide.
 * Une pièce finalisée ne propose plus rien du tout.
 */
export function statutsProposables(actuel: ItemStatus): ItemStatus[] {
  if (actuel === "finalized") return [];
  const base: ItemStatus[] = ["photos_taken", "on_sale", "unsellable"];
  return base.includes(actuel) ? base : [actuel, ...base];
}

export function estVerrouille(statut: ItemStatus): boolean {
  return statut === "finalized";
}

/** Une pièce compte dans le chiffre d'affaires dès qu'elle est vendue. */
export function estVendue(statut: ItemStatus): boolean {
  return statut === "sold" || statut === "finalized";
}

export function libelle(statut: ItemStatus, pour: "seller" | "client"): string {
  const info = STATUTS[statut];
  return pour === "client" ? info.labelCliente : info.label;
}
