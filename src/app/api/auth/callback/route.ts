import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete, dashboardPathForRole } from "@/lib/profile";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import type { Role } from "@/types/database";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }

      // Rattache au compte les demandes envoyées anonymement avec cette même
      // adresse (voir src/lib/requests-attach.ts).
      const rattacherDemandes = () => attachAnonymousRequests(supabase);

      if (profile) {
        await rattacherDemandes();

        if (requestUrl.searchParams.get("flow") === "signup") {
          // Confirmation d'inscription (pas un lien de connexion) : on ne
          // connecte pas automatiquement la personne, on la renvoie vers
          // /login pour qu'elle se connecte avec le mot de passe qu'elle
          // vient de choisir — c'est ce que l'écran de confirmation lui a
          // annoncé juste après l'inscription.
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/login?confirmed=1", requestUrl.origin).toString());
        }

        // Profile exists: send to /profile to fill phone/address when incomplete,
        // otherwise to the role dashboard.
        if (!isProfileComplete(profile)) {
          return NextResponse.redirect(new URL("/profile?incomplete=1", requestUrl.origin).toString());
        }
        return NextResponse.redirect(
          new URL(dashboardPathForRole(profile.role), requestUrl.origin).toString()
        );
      }

      // Pas encore de profil : c'est une première connexion par lien envoyé
      // depuis le formulaire de demande. Les informations saisies dans le
      // formulaire voyagent dans les métadonnées du compte : on crée le profil
      // ici, sans rien redemander à la cliente.
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      if (meta.first_name && meta.last_name && user.email) {
        const role: Role = meta.role === "seller" ? "seller" : "client";
        const newProfile = {
          id: user.id,
          email: user.email,
          first_name: meta.first_name,
          last_name: meta.last_name,
          phone: meta.phone ?? null,
          street_address: meta.street_address ?? null,
          role,
        };
        const { error: creationError } = await supabase.from("profiles").insert(newProfile);

        if (creationError) {
          console.error("[Auth callback] Création du profil impossible :", creationError.message);
        } else {
          await rattacherDemandes();
          return NextResponse.redirect(
            new URL(
              isProfileComplete(newProfile) ? dashboardPathForRole(role) : "/profile?incomplete=1",
              requestUrl.origin
            ).toString()
          );
        }
      }

      // Dernier recours : ni un profil existant, ni les métadonnées attendues
      // (métadonnées d'inscription incomplètes ou corrompues). On crée un
      // profil minimal plutôt que de renvoyer vers /login : la personne y est
      // déjà authentifiée, retenter un signUp par mot de passe échouerait
      // puisque le compte existe déjà.
      if (user.email) {
        const { error: creationError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          first_name: "",
          last_name: "",
          role: "client",
        });

        if (!creationError) {
          return NextResponse.redirect(new URL("/profile?incomplete=1", requestUrl.origin).toString());
        }
        console.error("[Auth callback] Création du profil minimal impossible :", creationError.message);
      }

      return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
}
