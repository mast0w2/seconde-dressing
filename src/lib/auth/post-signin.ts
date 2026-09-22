// src/lib/auth/post-signin.ts
// Ce qui se passe juste après qu'une session vient d'être ouverte, quel que
// soit le chemin emprunté : lien envoyé par Supabase (/api/auth/callback) ou
// lien envoyé par Brevo (/api/auth/confirm).
//
// Deux routes partageaient ce code : le profil n'était créé que dans l'une des
// deux, ce qui laissait des comptes sans profil — invisibles pour la page de
// connexion, qui cherchait le profil par e-mail avant de tenter la connexion.

import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete, dashboardPathForRole } from "@/lib/profile";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import { roleFromMetadata } from "@/lib/auth/role";

export interface PostSignInOptions {
  /**
   * Vrai quand le lien confirmait une inscription, et non une connexion.
   * On ne connecte alors pas automatiquement : la personne retourne sur
   * /login se connecter avec le mot de passe qu'elle vient de choisir,
   * comme l'écran de confirmation le lui a annoncé.
   */
  flowSignup?: boolean;
}

/**
 * Crée le profil si besoin, rattache les demandes anonymes, et renvoie le
 * chemin vers lequel rediriger la personne connectée.
 */
export async function resolvePostSignInDestination(
  supabase: SupabaseClient,
  { flowSignup = false }: PostSignInOptions = {}
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  // Confirmation d'inscription : la session ouverte par le lien n'a pas
  // vocation à durer.
  const terminer = async (destination: string) => {
    if (!flowSignup) return destination;
    await supabase.auth.signOut();
    return "/login?confirmed=1";
  };

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
    return terminer(
      isProfileComplete(profile) ? dashboardPathForRole(profile.role) : "/profile?incomplete=1"
    );
  }

  // Pas encore de profil : première arrivée par lien. Les informations
  // saisies à l'inscription ou dans le formulaire de demande voyagent dans
  // les métadonnées du compte, on crée le profil ici sans rien redemander.
  // Métadonnées absentes ou corrompues : on crée quand même un profil
  // minimal, plutôt que de renvoyer vers /login — la personne y est déjà
  // authentifiée, et retenter une inscription échouerait puisque le compte
  // existe.
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const nouveauProfil = {
    id: user.id,
    email: user.email,
    first_name: meta.first_name ?? "",
    last_name: meta.last_name ?? "",
    phone: meta.phone ?? null,
    street_address: meta.street_address ?? null,
    role: roleFromMetadata(user.user_metadata),
  };

  const { error: creationError } = await supabase.from("profiles").insert(nouveauProfil);

  if (creationError) {
    console.error("[post-signin] Création du profil impossible :", creationError.message);
    // La session est ouverte malgré tout : /profile sait créer un profil
    // minimal, c'est une meilleure sortie qu'une boucle vers /login.
    return terminer("/profile?incomplete=1");
  }

  await attachAnonymousRequests(supabase);

  return terminer(
    isProfileComplete(nouveauProfil)
      ? dashboardPathForRole(nouveauProfil.role)
      : "/profile?incomplete=1"
  );
}
