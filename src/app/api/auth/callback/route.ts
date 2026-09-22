// Point d'arrivée des liens générés par Supabase lui-même (flux PKCE :
// réinitialisation de mot de passe, confirmation d'inscription).
// Les liens que nous expédions par Brevo passent par /api/auth/confirm.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostSignInDestination } from "@/lib/auth/post-signin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth callback] Échange du code impossible :", error.message);

    // Même raison qu'en /api/auth/confirm : un lien déjà consommé rouvert
    // depuis la boîte mail ne doit pas renvoyer une erreur à quelqu'un dont
    // la session tient toujours.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const destination = await resolvePostSignInDestination(supabase);
      return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
    }

    return NextResponse.redirect(
      new URL("/login?lien=invalide", requestUrl.origin).toString()
    );
  }

  const destination = await resolvePostSignInDestination(supabase, {
    flowSignup: requestUrl.searchParams.get("flow") === "signup",
  });
  return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
}
