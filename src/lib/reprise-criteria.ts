// src/lib/reprise-criteria.ts
// Shared reprise criteria for the homepage estimation form and the
// demande-rdv confirmation checkbox tooltip.

import { Users, Sparkles, Gem, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RepriseCritere {
  icon: LucideIcon;
  texte: string;
}

export const REPRISE_CRITERES: RepriseCritere[] = [
  { icon: Users, texte: "Femme, homme et enfant — toutes les tailles." },
  {
    icon: Sparkles,
    texte: "Des pièces en bon état : rien de troué, taché, bouloché ou déformé.",
  },
  {
    icon: Gem,
    texte:
      "Une valeur d'au moins 15 € en seconde main par pièce : on recherche plutôt de belles matières et des marques premium — Sézane, Sandro, Ba&sh…",
  },
  {
    icon: Ban,
    texte: "Pas d'ultra fast fashion (Shein, Temu, Primark…) : ces pièces ne trouvent pas preneur.",
  },
];
