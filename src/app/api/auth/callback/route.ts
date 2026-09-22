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

      // Dernier recours : la page de connexion crée un profil minimal et
      // redirige vers /profile pour le compléter.
      return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
}
