// Envoi du lien de connexion à l'espace de suivi.
//
// Pourquoi une route serveur plutôt qu'un simple signInWithOtp() côté
// navigateur : le mailer intégré de Supabase est plafonné à deux envois par
// heure sur le plan gratuit. En production, la quasi-totalité des liens
// repartait en « 429 email rate limit exceeded » et aucune cliente ne recevait
// rien. Ici, Supabase se contente de *fabriquer* le jeton (API admin, aucun
// envoi de sa part) et c'est Brevo — déjà utilisé pour les autres e-mails du
// site — qui expédie le message.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { notificationService } from "@/lib/email";
import { capitalizeName } from "@/lib/text";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Anti-abus minimal : la route envoie un e-mail à une adresse arbitraire.
// En mémoire du processus, donc au mieux par instance — c'est un garde-fou,
// pas une garantie.
const DELAI_ENTRE_ENVOIS_MS = 60_000;
const MAX_PAR_HEURE = 5;
const historique = new Map<string, number[]>();

function tropDeDemandes(email: string): boolean {
  const maintenant = Date.now();
  const envois = (historique.get(email) ?? []).filter(
    (t) => maintenant - t < 3_600_000
  );

  if (envois.length >= MAX_PAR_HEURE) return true;
  if (envois.length > 0 && maintenant - envois[envois.length - 1] < DELAI_ENTRE_ENVOIS_MS) {
    return true;
  }

  envois.push(maintenant);
  historique.set(email, envois);
  return false;
}

/**
 * Cherche un compte par adresse e-mail via l'API admin de GoTrue.
 * Le SDK n'expose pas de recherche par e-mail : on interroge le point de
 * terminaison directement. `filter` fait une recherche sur l'e-mail, on
 * revérifie donc l'égalité exacte.
 */
async function trouverCompte(
  email: string
): Promise<{ existe: boolean; erreur?: string }> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { existe: false, erreur: "not_configured" };

  const { url } = getSupabaseEnv();
  const endpoint = `${url}/auth/v1/admin/users?page=1&per_page=20&filter=${encodeURIComponent(email)}`;

  try {
    const reponse = await fetch(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!reponse.ok) {
      return { existe: false, erreur: `admin users ${reponse.status}` };
    }

    const corps = (await reponse.json()) as { users?: Array<{ email?: string }> };
    const existe = (corps.users ?? []).some(
      (u) => (u.email ?? "").toLowerCase() === email
    );
    return { existe };
  } catch (error) {
    return {
      existe: false,
      erreur: error instanceof Error ? error.message : String(error),
    };
  }
}

interface CorpsRequete {
  email?: unknown;
  prenom?: unknown;
  nom?: unknown;
  telephone?: unknown;
  adresse?: unknown;
  creerCompte?: unknown;
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
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ statut: "email_invalide" }, { status: 400 });
  }

  // Par défaut on crée le compte : c'est le cas du formulaire de demande.
  // La page de connexion, elle, passe explicitement false.
  const creerCompte = corps.creerCompte !== false;
  const prenom = typeof corps.prenom === "string" ? capitalizeName(corps.prenom.trim()) : "";
  const nom = typeof corps.nom === "string" ? capitalizeName(corps.nom.trim()) : "";
  const telephone = typeof corps.telephone === "string" ? corps.telephone.trim() : "";
  const adresse = typeof corps.adresse === "string" ? corps.adresse.trim() : "";

  const admin = getSupabaseAdminClient();
  if (!admin) {
    // Sans clé service role, le navigateur retombe sur signInWithOtp().
    console.warn(
      "[Auth espace] SUPABASE_SERVICE_ROLE_KEY absente : envoi du lien délégué au mailer Supabase."
    );
    return NextResponse.json({ statut: "indisponible" });
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn("[Auth espace] BREVO_API_KEY absente : envoi du lien impossible.");
    return NextResponse.json({ statut: "indisponible" });
  }

  const compte = await trouverCompte(email);
  if (compte.erreur) {
    console.error("[Auth espace] Recherche du compte impossible :", compte.erreur);
    return NextResponse.json({ statut: "indisponible" });
  }

  if (!compte.existe && !creerCompte) {
    return NextResponse.json({ statut: "compte_inconnu" });
  }

  if (tropDeDemandes(email)) {
    return NextResponse.json({ statut: "trop_de_demandes" }, { status: 429 });
  }

  const premiereConnexion = !compte.existe;

  if (premiereConnexion) {
    // Compte non confirmé : c'est le clic sur le lien qui vaut vérification
    // de l'adresse. Les informations du formulaire voyagent dans les
    // métadonnées, le profil est créé à l'arrivée (lib/auth/post-signin.ts).
    const { error } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: prenom,
        last_name: nom,
        phone: telephone || null,
        street_address: adresse || null,
        role: "client",
      },
    });

    if (error) {
      console.error("[Auth espace] Création du compte impossible :", error.message);
      return NextResponse.json({ statut: "erreur" }, { status: 500 });
    }
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    console.error(
      "[Auth espace] Génération du lien impossible :",
      error?.message ?? "hashed_token absent"
    );
    return NextResponse.json({ statut: "erreur" }, { status: 500 });
  }

  // L'URL du site vient de la requête : les préproductions Vercel gardent
  // ainsi un lien qui pointe vers elles-mêmes.
  const origine = new URL(request.url).origin;
  const base = process.env.NEXT_PUBLIC_SITE_URL || origine;
  const lien = `${base.replace(/\/$/, "")}/api/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=magiclink`;

  const envoi = await notificationService.sendEspaceLink(
    email,
    prenom || "à vous",
    lien,
    { premiereConnexion }
  );

  if (!envoi.success) {
    console.error(
      "[Auth espace] Envoi du lien impossible pour",
      email,
      "-",
      envoi.error || envoi.message
    );
    return NextResponse.json({ statut: "erreur" }, { status: 500 });
  }

  return NextResponse.json({ statut: "envoye", premiereConnexion });
}
