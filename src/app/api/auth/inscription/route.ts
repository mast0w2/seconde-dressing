// Inscription : création du compte et envoi du mail de confirmation.
//
// Même raison que /api/auth/espace : le mailer intégré de Supabase plafonne à
// deux envois par heure et renvoyait des « 429 » sur /signup. Ici, l'API admin
// fabrique le compte et le jeton de confirmation sans rien expédier, et Brevo
// se charge du message.
//
// Le profil n'est volontairement pas créé ici : il l'est à la confirmation
// (lib/auth/post-signin.ts), quand la session existe. L'insérer depuis le
// navigateur juste après signUp() échouait sur la RLS de `profiles`
// (auth.uid() est nul tant que l'adresse n'est pas confirmée), et l'erreur
// masquait l'écran « confirmez votre adresse ».

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { notificationService } from "@/lib/email";
import { capitalizeName } from "@/lib/text";
import { allowRequest, clientIp } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGUEUR_MOT_DE_PASSE_MIN = 6;

interface CorpsRequete {
  email?: unknown;
  password?: unknown;
  prenom?: unknown;
  nom?: unknown;
  role?: unknown;
}

export async function POST(request: Request) {
  let corps: CorpsRequete;
  try {
    corps = (await request.json()) as CorpsRequete;
  } catch {
    return NextResponse.json({ statut: "erreur" }, { status: 400 });
  }

  const email =
    typeof corps.email === "string" ? corps.email.trim().toLowerCase() : "";
  const password = typeof corps.password === "string" ? corps.password : "";
  const prenom =
    typeof corps.prenom === "string" ? capitalizeName(corps.prenom.trim()) : "";
  const nom = typeof corps.nom === "string" ? capitalizeName(corps.nom.trim()) : "";
  // Le rôle est choisi explicitement à l'inscription. Toute autre valeur que
  // « seller » vaut cliente : on ne se fie pas à ce que poste le navigateur
  // pour accorder des droits vendeuse par accident.
  const role = corps.role === "seller" ? "seller" : "client";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ statut: "email_invalide" }, { status: 400 });
  }
  if (password.length < LONGUEUR_MOT_DE_PASSE_MIN) {
    return NextResponse.json({ statut: "mot_de_passe_court" }, { status: 400 });
  }
  if (!prenom || !nom) {
    return NextResponse.json({ statut: "identite_incomplete" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin || !process.env.BREVO_API_KEY) {
    // Le navigateur retombe sur supabase.auth.signUp().
    console.warn(
      "[Auth inscription] Clé service role ou Brevo absente : inscription déléguée au mailer Supabase."
    );
    return NextResponse.json({ statut: "indisponible" });
  }

  // Each call creates an account and emails the address typed in the form.
  const allowed = await allowRequest(
    { key: `signup:ip:${clientIp(request)}`, max: 10, windowSeconds: 3600 },
    { key: `signup:to:${email}`, max: 3, windowSeconds: 3600 }
  );
  if (!allowed) {
    return NextResponse.json({ statut: "trop_de_demandes" }, { status: 429 });
  }

  // type "signup" crée le compte (non confirmé) et renvoie le jeton, sans
  // qu'aucun e-mail ne parte de chez Supabase.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: {
        first_name: prenom,
        last_name: nom,
        role,
        // A password is chosen right here, so the login page must ask for it.
        password_set: true,
      },
    },
  });

  if (error) {
    const dejaInscrite =
      error.code === "email_exists" ||
      /already.*registered|already exists/i.test(error.message);
    if (dejaInscrite) {
      return NextResponse.json({ statut: "email_deja_utilise" }, { status: 409 });
    }
    console.error("[Auth inscription] Création du compte impossible :", error.message);
    return NextResponse.json({ statut: "erreur" }, { status: 500 });
  }

  const hashedToken = data?.properties?.hashed_token;
  if (!hashedToken) {
    console.error("[Auth inscription] hashed_token absent de la réponse admin.");
    return NextResponse.json({ statut: "erreur" }, { status: 500 });
  }

  const origine = new URL(request.url).origin;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origine).replace(/\/$/, "");
  const lien = `${base}/api/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=signup`;

  const envoi = await notificationService.sendConfirmationInscription(email, prenom, lien, {
    vendeuse: role === "seller",
  });

  if (!envoi.success) {
    console.error(
      "[Auth inscription] Envoi de la confirmation impossible pour",
      email,
      "-",
      envoi.error || envoi.message
    );
    return NextResponse.json({ statut: "erreur_envoi" }, { status: 500 });
  }

  // A seller account opens nothing until an admin approves it: tell the
  // admins there is someone to review. A failure here must not fail the
  // signup, the account is already created.
  if (role === "seller") {
    const alerte = await notificationService.sendSellerSignupToAdmins({ prenom, nom, email });
    if (!alerte.success) {
      console.error(
        "[Auth inscription] Alerte admin non envoyée pour",
        email,
        "-",
        alerte.error || alerte.message
      );
    }
  }

  return NextResponse.json({ statut: "envoye" });
}
