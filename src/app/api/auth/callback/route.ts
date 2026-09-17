import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile";

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
      // adresse. C'est ce qui relie le formulaire public au tableau de bord :
      // la cliente remplit sa demande sans compte, puis clique sur le lien
      // reçu par email et retrouve sa demande dans son espace.
      const rattacherDemandes = async () => {
        if (!user.email) return;
        const { error } = await supabase
          .from("requests")
          .update({ client_id: user.id })
          .eq("client_email", user.email)
          .is("client_id", null);
        if (error) {
          console.error("[Auth callback] Rattachement des demandes impossible :", error.message);
        }
      };

      if (profile) {
        await rattacherDemandes();
        // Profile exists: send to /profile to fill phone/address when incomplete,
        // otherwise to the role dashboard.
        if (!isProfileComplete(profile)) {
          return NextResponse.redirect(new URL("/profile", requestUrl.origin).toString());
        }
        const dashboard =
          profile.role === "seller"
            ? "/dashboard/seller"
            : "/dashboard/client";
        return NextResponse.redirect(new URL(dashboard, requestUrl.origin).toString());
      }

      // Pas encore de profil : c'est une première connexion par lien envoyé
      // depuis le formulaire de demande. Les informations saisies dans le
      // formulaire voyagent dans les métadonnées du compte : on crée le profil
      // ici, sans rien redemander à la cliente.
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      if (meta.first_name && meta.last_name && user.email) {
        const { error: creationError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          first_name: meta.first_name,
          last_name: meta.last_name,
          phone: meta.phone ?? null,
          street_address: meta.street_address ?? null,
          role: meta.role === "seller" ? "seller" : "client",
        });

        if (creationError) {
          console.error("[Auth callback] Création du profil impossible :", creationError.message);
        } else {
          await rattacherDemandes();
          return NextResponse.redirect(
            new URL("/dashboard/client", requestUrl.origin).toString()
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
