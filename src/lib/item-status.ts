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
  awaiting_client: {
    label: "En attente de la cliente",
    labelCliente: "Prix à valider",
    fond: "#e7e3ef",
    texte: "#4c4663",
    bordure: "#b3aacb",
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
    // Côté cliente, rien ne change encore : l'acheteur a payé la plateforme,
    // mais l'argent n'est pas sécurisé et la vente peut encore se défaire.
    // Annoncer « vendue » pour le reprendre ensuite serait pire que d'attendre.
    labelCliente: "En vente",
    fond: "#d2e2c4",
    texte: "#3b5029",
    bordure: "#7e9468",
  },
  finalized: {
    label: "Finalisé",
    // « Finalisé » veut dire que la vendeuse a reçu l'argent, pas que la
    // cliente a été payée : son virement part ensuite.
    labelCliente: "Vendue — paiement en cours",
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
  "awaiting_client",
  "on_sale",
  "sold",
  "finalized",
  "unsellable",
];

/**
 * Statuts proposés dans le menu déroulant, selon l'état courant.
 *
 * Le parcours d'une pièce ne se choisit pas dans une liste : chaque étape
 * s'obtient par un geste qui a ses conditions. Envoyer les prix demande une
 * fiche complète, la mise en vente demande l'accord de la cliente, la vente
 * demande un prix, la finalisation une preuve. La seule bifurcation libre est
 * « Invendable », qui peut survenir à n'importe quel moment et se défaire.
 *
 * Une liste vide veut dire : pas de menu, une pastille.
 */
export function statutsProposables(actuel: ItemStatus): ItemStatus[] {
  switch (actuel) {
    case "photos_taken":
      return ["photos_taken", "unsellable"];
    case "on_sale":
      return ["on_sale", "unsellable"];
    case "unsellable":
      return ["unsellable", "photos_taken"];
    default:
      return [];
  }
}

export function estVerrouille(statut: ItemStatus): boolean {
  return statut === "finalized";
}

/** La cliente a les prix en main et n'a pas encore répondu. */
export function attendLaCliente(statut: ItemStatus): boolean {
  return statut === "awaiting_client";
}

/**
 * Délai laissé à la cliente pour répondre. Passé ce délai, les prix proposés
 * sont réputés acceptés. La même durée est appliquée en base
 * (request_items_delai_validation).
 */
export const DELAI_VALIDATION_HEURES = 48;

/** Une pièce compte dans le chiffre d'affaires dès qu'elle est vendue. */
export function estVendue(statut: ItemStatus): boolean {
  return statut === "sold" || statut === "finalized";
}

/**
 * Une vente acquise, du point de vue de la cliente.
 *
 * Seule une pièce finalisée compte : tant que la vendeuse n'a pas encaissé,
 * l'acheteur peut encore ouvrir un litige et la vente se défaire. C'est aussi
 * pour cela que « vendu » n'apparaît pas dans son vocabulaire.
 */
export function venteAcquise(statut: ItemStatus): boolean {
  return statut === "finalized";
}

/**
 * Ce que le statut devient du point de vue de la cliente.
 *
 * Son parcours a une étape de moins : « vendu » et « vente en cours » sont le
 * même moment pour elle, tant que l'argent n'est pas acquis. Deux états qui
 * portent le même mot doivent aussi porter la même couleur — sinon on lit
 * deux fois « En vente » dans deux teintes différentes, et on cherche la
 * différence qu'on ne nous dit pas.
 */
export function statutVuCliente(statut: ItemStatus): ItemStatus {
  return statut === "sold" ? "on_sale" : statut;
}

export function libelle(statut: ItemStatus, pour: "seller" | "client"): string {
  if (pour === "client") return STATUTS[statutVuCliente(statut)].labelCliente;
  return STATUTS[statut].label;
}
