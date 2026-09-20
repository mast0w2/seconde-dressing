// src/lib/requests-attach.ts
// Rattache au compte connecté les demandes envoyées anonymement depuis le
// formulaire public avec la même adresse e-mail (client_id encore NULL), ainsi
// que les contrats générés sur ces demandes.
//
// C'est ce qui relie le formulaire public au tableau de bord cliente : la
// cliente remplit sa demande sans compte, puis se connecte (lien magique,
// mot de passe, ou session déjà ouverte) et retrouve ses demandes.
// Le travail est fait par la fonction SQL attach_anonymous_requests()
// (migration 0008), à partir de l'e-mail du JWT. Idempotent.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Renvoie le nombre de demandes rattachées (0 si rien à faire ou en erreur). */
export async function attachAnonymousRequests(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("attach_anonymous_requests");
  if (error) {
    console.error("[requests-attach] Rattachement impossible :", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}
