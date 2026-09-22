// Point d'arrivée des liens de connexion que nous expédions nous-mêmes par
// Brevo (voir /api/auth/espace et /api/auth/inscription).
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
    console.warn("[Auth confirm] Lien refusé :", error.message);

    // Un lien de connexion ne sert qu'une fois. Mais rouvrir l'email plus
    // tard est le réflexe le plus naturel du monde, et à ce moment-là la
    // session ouverte au premier clic est presque toujours encore valide :
    // inutile de renvoyer vers une page d'erreur quelqu'un qui est déjà
    // connecté. On le mène simplement à son espace.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && type !== "recovery") {
      const destination = await resolvePostSignInDestination(supabase);
      return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
    }

    // Réellement personne derrière : on l'explique, et la page de connexion
    // permet d'en redemander un.
    return NextResponse.redirect(
      new URL("/login?lien=expire", requestUrl.origin).toString()
    );
  }

  // A "recovery" link is there to set a password, not to walk into the space:
  // the session it just opened allows updateUser(), which is exactly what
  // /reset-password does. Sending this person to the dashboard would leave
  // them without the password they came to create.
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin).toString());
  }

  // Une confirmation d'inscription ne connecte pas : la personne se connecte
  // ensuite avec le mot de passe qu'elle a choisi.
  const destination = await resolvePostSignInDestination(supabase, {
    flowSignup: type === "signup",
  });
  return NextResponse.redirect(new URL(destination, requestUrl.origin).toString());
}
