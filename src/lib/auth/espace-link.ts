// src/lib/auth/espace-link.ts
// Demande d'un lien de connexion à l'espace de suivi, côté navigateur.
//
// Chemin normal : la route /api/auth/espace fabrique le lien et l'expédie par
// Brevo. Si la clé service role ou la clé Brevo manquent, on retombe sur le
// mailer de Supabase — moins fiable (quelques envois par heure) mais mieux
// que rien, et surtout : le déploiement ne casse pas tant que la variable
// d'environnement n'est pas en place.

import { getSupabaseClient } from "@/lib/supabase/client";

export type StatutLien =
  | "envoye"
  | "compte_inconnu"
  | "trop_de_demandes"
  | "echec";

export interface ResultatLien {
  statut: StatutLien;
  premiereConnexion?: boolean;
}

export interface DemandeLien {
  email: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  /** false depuis la page de connexion : on ne crée pas de compte à la volée. */
  creerCompte?: boolean;
}

async function replierSurSupabase(demande: DemandeLien): Promise<ResultatLien> {
  const supabase = getSupabaseClient();
  const creerCompte = demande.creerCompte !== false;

  const { error } = await supabase.auth.signInWithOtp({
    email: demande.email,
    options: {
      shouldCreateUser: creerCompte,
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      data: creerCompte
        ? {
            first_name: demande.prenom ?? "",
            last_name: demande.nom ?? "",
            phone: demande.telephone ?? null,
            street_address: demande.adresse ?? null,
            role: "client",
            // Same flag as the server route: no password on this account.
            password_set: false,
          }
        : undefined,
    },
  });

  if (!error) {
    return { statut: "envoye", premiereConnexion: creerCompte };
  }

  console.warn("[espace-link] Repli Supabase en échec :", error.message);

  // « Signups not allowed for otp » : aucun compte derrière cette adresse.
  if (error.code === "otp_disabled" || /signups not allowed/i.test(error.message)) {
    return { statut: "compte_inconnu" };
  }
  if (error.status === 429 || /rate limit/i.test(error.message)) {
    return { statut: "trop_de_demandes" };
  }
  return { statut: "echec" };
}

export async function envoyerLienEspace(demande: DemandeLien): Promise<ResultatLien> {
  try {
    const reponse = await fetch("/api/auth/espace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(demande),
    });

    const corps = (await reponse.json().catch(() => ({}))) as {
      statut?: string;
      premiereConnexion?: boolean;
    };

    switch (corps.statut) {
      case "envoye":
        return { statut: "envoye", premiereConnexion: corps.premiereConnexion };
      case "compte_inconnu":
        return { statut: "compte_inconnu" };
      case "trop_de_demandes":
        return { statut: "trop_de_demandes" };
      case "indisponible":
        return replierSurSupabase(demande);
      default:
        return { statut: "echec" };
    }
  } catch (error) {
    console.warn(
      "[espace-link] Appel de /api/auth/espace impossible :",
      error instanceof Error ? error.message : String(error)
    );
    return replierSurSupabase(demande);
  }
}
