// Point d'arrivée des liens générés par Supabase lui-même (flux PKCE :
// réinitialisation de mot de passe, confirmation d'inscription).
// Les liens de l'espace de suivi, eux, passent par /api/auth/confirm.

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
    return NextResponse.redirect(
      new URL("/login?lien=invalide", requestUrl.origin).toString()
    );
  }

  const destination = await resolvePostSignInDestination(supabase);
  return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
}
