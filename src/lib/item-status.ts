// src/lib/item-status.ts
//
// Vocabulaire et couleurs des statuts d'une pièce d'inventaire.
//
// Deux vocabulaires pour les mêmes états : celui de la vendeuse, qui parle de
// son travail, et celui de la cliente, qui ne veut savoir qu'une chose — où en
// est sa pièce et quand elle est payée. Les deux vivent ici pour qu'on ne
// puisse pas les faire diverger par inadvertance.
//
// Les couleurs sont des teintes désaturées de la charte : un tableau
// d'inventaire se lit toute la journée, il ne doit pas crier.

import type { ItemStatus } from "@/types/database";

export interface StatutInfo {
  /** Libellé côté vendeuse. */
  label: string;
  /** Libellé côté cliente : ce qu'elle a besoin de comprendre. */
  labelCliente: string;
  /** Couleur de fond de la pastille. */
  fond: string;
  /** Couleur du texte de la pastille. */
  texte: string;
  /** Couleur de la bordure. */
  bordure: string;
}

export const STATUTS: Record<ItemStatus, StatutInfo> = {
  photos_taken: {
    label: "Photos prises",
    labelCliente: "Prête à être mise en vente",
    fond: "#e6ebdd",
    texte: "#4a5543",
    bordure: "#c7d0b7",
  },
  on_sale: {
    label: "Vente en cours",
    labelCliente: "En vente",
    fond: "#f3e7d2",
    texte: "#7a5c22",
    bordure: "#d9be8c",
  },
  sold: {
    label: "Vendu",
    labelCliente: "Vendue — paiement en cours",
    fond: "#dfe6d6",
    texte: "#46543a",
    bordure: "#8b9a7a",
  },
  finalized: {
    label: "Finalisé",
    labelCliente: "Vendue — vous avez été payée",
    fond: "#dde4ea",
    texte: "#3f4e5c",
    bordure: "#93a5b5",
  },
  unsellable: {
    label: "Invendable",
    labelCliente: "Invendable",
    fond: "#e8e6e1",
    texte: "#5c5952",
    bordure: "#c2beb5",
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
 * Statuts proposables dans le menu déroulant.
 *
 * « Finalisé » n'y figure pas : on y arrive par un bouton dédié, avec
 * justificatif, parce que c'est irréversible (voir la migration 0024).
 * Une pièce déjà finalisée ne propose plus rien du tout.
 */
export function statutsProposables(actuel: ItemStatus): ItemStatus[] {
  if (actuel === "finalized") return [];
  return ORDRE_STATUTS.filter((s) => s !== "finalized");
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
