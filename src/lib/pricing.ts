// src/lib/pricing.ts
// Source unique de vérité pour la répartition du prix de vente.
//
// Pour changer le modèle économique (part cliente / vendeuse / plateforme),
// il suffit de modifier REVENUE_SPLIT ci-dessous : tout le reste du site
// (page d'accueil, page concept, formulaire d'estimation, e-mails, SEO) en
// découle automatiquement.

/** Répartition du prix de vente de chaque pièce. Doit totaliser 1 (100 %). */
export const REVENUE_SPLIT = {
  /** Part reversée à la cliente qui confie ses vêtements. */
  cliente: 0.5,
  /** Part reversée à la vendeuse qui trie, photographie et vend. */
  vendeuse: 0.4,
  /** Part conservée par la plateforme Seconde. */
  plateforme: 0.1,
} as const;

export type RevenueSplitParty = keyof typeof REVENUE_SPLIT;

export const PART_CLIENTE = REVENUE_SPLIT.cliente;
export const PART_VENDEUSE = REVENUE_SPLIT.vendeuse;
export const PART_PLATEFORME = REVENUE_SPLIT.plateforme;

// Garde-fou : une répartition qui ne fait pas 100 % est une erreur de config.
const TOTAL_SPLIT = Object.values(REVENUE_SPLIT).reduce((sum, part) => sum + part, 0);
if (Math.abs(TOTAL_SPLIT - 1) > 1e-9) {
  throw new Error(
    `[pricing] REVENUE_SPLIT doit totaliser 100 % (actuellement ${(TOTAL_SPLIT * 100).toFixed(2)} %).`
  );
}

/** Pourcentage entier correspondant à une part : 0.5 -> 50. */
export function sharePercent(part: number): number {
  return Math.round(part * 1000) / 10;
}

/**
 * Formate une part pour l'affichage.
 * Par défaut la typographie française ("50 %") ; `compact` pour "50%".
 */
export function formatShare(part: number, { compact = false }: { compact?: boolean } = {}): string {
  return compact ? `${sharePercent(part)}%` : `${sharePercent(part)} %`;
}

/** Montant qui revient à la cliente pour un total de ventes donné. */
export function montantCliente(totalVentes: number): number {
  return totalVentes * PART_CLIENTE;
}

/** Montant qui revient à la vendeuse pour un total de ventes donné. */
export function montantVendeuse(totalVentes: number): number {
  return totalVentes * PART_VENDEUSE;
}

/** Montant conservé par la plateforme pour un total de ventes donné. */
export function montantPlateforme(totalVentes: number): number {
  return totalVentes * PART_PLATEFORME;
}
