// Point d'arrivée des liens de connexion que nous expédions nous-mêmes par
// Brevo (voir /api/auth/espace).
//
// Le lien porte un token_hash plutôt qu'un code PKCE : c'est le seul format
// qu'un serveur peut valider. Les liens « implicites » de Supabase déposent
// les jetons dans le fragment de l'URL (#access_token=…), que le serveur ne
// reçoit jamais.

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostSignInDestination } from "@/lib/auth/post-signin";

const TYPES_ACCEPTES: EmailOtpType[] = ["magiclink", "email", "signup", "invite", "recovery"];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !TYPES_ACCEPTES.includes(type)) {
    return NextResponse.redirect(
      new URL("/login?lien=invalide", requestUrl.origin).toString()
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Lien déjà utilisé ou expiré : on le dit clairement sur la page de
    // connexion, d'où un nouveau lien peut être demandé.
    console.warn("[Auth confirm] Lien refusé :", error.message);
    return NextResponse.redirect(
      new URL("/login?lien=expire", requestUrl.origin).toString()
    );
  }

  const destination = await resolvePostSignInDestination(supabase);
  return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
}
