// src/lib/auth/post-signin.ts
// Ce qui se passe juste après qu'une session vient d'être ouverte, quel que
// soit le chemin emprunté : lien envoyé par Supabase (/api/auth/callback) ou
// lien envoyé par Brevo (/api/auth/confirm).
//
// Deux routes partageaient ce code : le profil n'était créé que dans l'une des
// deux, ce qui laissait des comptes sans profil — invisibles pour la page de
// connexion, qui cherche le profil par e-mail avant de tenter la connexion.

import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete } from "@/lib/profile";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import { roleFromMetadata } from "@/lib/auth/role";

const dashboardForRole = (role: string | null | undefined) =>
  role === "seller" ? "/dashboard/seller" : "/dashboard/client";

/**
 * Crée le profil si besoin, rattache les demandes anonymes, et renvoie le
 * chemin vers lequel rediriger la personne connectée.
 */
export async function resolvePostSignInDestination(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[post-signin] Lecture du profil impossible :", profileError.message);
  }

  if (profile) {
    await attachAnonymousRequests(supabase);
    // Profil incomplet : on fait compléter le téléphone / l'adresse avant
    // d'envoyer sur le tableau de bord.
    return isProfileComplete(profile) ? dashboardForRole(profile.role) : "/profile";
  }

  // Pas encore de profil : c'est une première connexion par lien. Les
  // informations saisies dans le formulaire de demande voyagent dans les
  // métadonnées du compte, on crée le profil ici sans rien redemander.
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const role = roleFromMetadata(user.user_metadata);

  const { error: creationError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    first_name: meta.first_name ?? "",
    last_name: meta.last_name ?? "",
    phone: meta.phone ?? null,
    street_address: meta.street_address ?? null,
    role,
  });

  if (creationError) {
    console.error("[post-signin] Création du profil impossible :", creationError.message);
    // La session est ouverte malgré tout : on envoie vers /profile, qui sait
    // créer un profil minimal, plutôt que de renvoyer vers /login en boucle.
    return "/profile";
  }

  await attachAnonymousRequests(supabase);

  // Le formulaire de demande fournit prénom, nom, téléphone et adresse : le
  // profil est complet et on peut aller droit au tableau de bord. Sinon on
  // passe par /profile pour compléter.
  return meta.first_name && meta.last_name && meta.phone && meta.street_address
    ? dashboardForRole(role)
    : "/profile";
}
