// src/lib/auth/role.ts
// Le rôle voyage dans les métadonnées du compte (user_metadata.role), posées
// à l'inscription ou à l'envoi du formulaire de demande.
//
// Plusieurs écrans créaient un profil de secours en forçant role: "client".
// Une vendeuse qui passait par l'un d'eux se retrouvait cliente, sans que rien
// ne le signale. Tout le monde lit désormais le rôle au même endroit.

import type { Role } from "@/types/database";

export function roleFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): Role {
  return metadata?.role === "seller" ? "seller" : "client";
}
