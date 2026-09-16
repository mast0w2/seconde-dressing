// src/lib/formulas.ts
// Detailed French descriptions for the priced service formulas.
// Used by tooltips across the appointment-request form and other client-facing UI.
// The short English descriptions live in the `formulas` table; these long
// descriptions match the wording from the homepage estimation form.

export interface FormulaDetail {
  slug: string;
  description: string;
}

export const FORMULA_DETAILS: Record<string, string> = {
  "pre-sorted":
    "Vos vêtements sont déjà mis de côté, et vous remplirez vous-même l'inventaire de vos pièces avant notre passage. On vient simplement les récupérer.",
  "on-site-sorting":
    "Vous avez mis de côté ce dont vous ne voulez plus, mais vous ne savez pas ce qui a de la valeur. On passe 30 min à 1 h chez vous pour trier et repérer les pièces qui se revendront.",
  "sorting-and-advice":
    "Rendez-vous d'1 h à 1 h 30 : on trie avec vous et on vous conseille — ce qui vaut le coup d'être vendu, ce qui vous va le mieux, ce que vous avez intérêt à garder.",
};

export function getFormulaDetail(slug: string): string {
  return FORMULA_DETAILS[slug] || "";
}
