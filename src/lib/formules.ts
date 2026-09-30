// src/lib/formules.ts
//
// Ce qui dépend de la formule choisie par la cliente.

export type RoleInventaire = "client" | "seller";

/**
 * Qui saisit le prix minimal de chaque pièce.
 *
 * Formule « Déjà trié » : la cliente a fait l'inventaire elle-même, elle fixe
 * donc son propre plancher. Pour toutes les autres formules, c'est la vendeuse
 * qui le propose — et la cliente qui le valide.
 */
export function minPriceEditorFor(formulaSlug: string | null | undefined): RoleInventaire {
  return formulaSlug === "pre-sorted" ? "client" : "seller";
}
