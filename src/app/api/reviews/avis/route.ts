// src/app/api/reviews/route.ts
//
// Réception d'un reviews cliente. Volontairement SANS base de données : un reviews
// n'a pas besoin d'être stocké pour être utile, et faire dépendre l'envoi de
// Supabase le casse dès que la configuration locale n'est pas complète.
// L'reviews arrive par email ; il est ensuite ajouté à la main dans src/data/reviews.ts
// après vérification, ce qui garantit qu'aucun reviews n'est publié sans contrôle.

import { NextResponse } from "next/server";
import { emailService } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CorpsAvis {
  prenom: string;
  nom: string;
  email: string;
  ville?: string;
  note: number;
  texte: string;
  consentement: boolean;
}

function valider(data: unknown): { ok: true; reviews: CorpsAvis } | { ok: false; erreurs: string[] } {
  const erreurs: string[] = [];
  if (!data || typeof data !== "object") return { ok: false, erreurs: ["Corps de requête invalide"] };

  const d = data as Record<string, unknown>;
  const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const prenom = texte(d.prenom);
  const nom = texte(d.nom);
  const email = texte(d.email);
  const ville = texte(d.ville);
  const reviewsTexte = texte(d.texte);
  const note = typeof d.note === "number" ? Math.round(d.note) : 0;

  if (!prenom) erreurs.push("Prénom manquant");
  if (!nom) erreurs.push("Nom manquant");
  if (!EMAIL_REGEX.test(email)) erreurs.push("Email invalide");
  if (note < 1 || note > 5) erreurs.push("Note invalide");
  if (reviewsTexte.length < 5) erreurs.push("Avis trop court");
  if (d.consentement !== true) erreurs.push("Autorisation de publication manquante");

  if (erreurs.length > 0) return { ok: false, erreurs };
  return { ok: true, reviews: { prenom, nom, email, ville, note, texte: reviewsTexte, consentement: true } };
}

function corpsEmail(a: CorpsAvis): string {
  return [
    "NOUVEL AVIS CLIENTE",
    "",
    `Note : ${a.note}/5`,
    "",
    "Avis :",
    a.texte,
    "",
    "--- Informations de vérification (ne pas publier) ---",
    `Prénom (publié) : ${a.prenom}`,
    `Nom : ${a.nom}`,
    `Email : ${a.email}`,
    `Ville : ${a.ville || "non renseignée"}`,
    `Autorisation de publication : OUI, reçue le ${new Date().toLocaleString("fr-FR")}`,
    "",
    "Pour publier : ajouter une entrée dans src/data/reviews.ts, et conserver cet email comme preuve du consentement.",
  ].join("\n");
}

/**
 * Destinataires de l'alerte. On accepte les deux orthographes de la variable
 * d'environnement : le code historique lit CONTACT_ADMIN_EMAILS, mais la
 * production a été configurée avec CONTACT_ADMIN_EMAIL (au singulier).
 * Sans ce repli, l'reviews partirait dans le vide sans que personne le sache.
 */
function destinataires(): string[] {
  const brut = process.env.CONTACT_ADMIN_EMAILS || process.env.CONTACT_ADMIN_EMAIL || "";
  return brut
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

export async function POST(request: Request) {
  try {
    const validation = valider(await request.json());
    if (!validation.ok) {
      return NextResponse.json({ success: false, errors: validation.erreurs }, { status: 400 });
    }

    const a = validation.reviews;
    const message = corpsEmail(a);

    // On journalise TOUJOURS l'reviews, quoi qu'il arrive ensuite. C'est le filet
    // de sécurité : même si l'email échoue, l'reviews reste récupérable dans les
    // logs du serveur. Un reviews de cliente ne doit jamais disparaître.
    console.log("[Avis] Avis reçu :\n" + message);

    const admins = destinataires();
    if (admins.length === 0) {
      console.error(
        "[Avis] Aucun destinataire configuré (CONTACT_ADMIN_EMAILS). L'reviews n'a pas été envoyé par email."
      );
      return NextResponse.json({ success: true, envoye: false });
    }

    const html =
      "<h2>Nouvel reviews cliente</h2><pre style=\"font-family:inherit;white-space:pre-wrap\">" +
      message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
      "</pre>";
    const sujet = `Avis cliente — ${a.prenom} — ${a.note}/5`;

    let envoye = false;
    for (const admin of admins) {
      const resultat = await emailService.sendEmailWithFallback(admin, sujet, html);
      if (resultat.success) {
        envoye = true;
      } else {
        console.error("[Avis] Envoi impossible vers", admin, ":", resultat.message);
      }
    }

    return NextResponse.json({ success: true, envoye });
  } catch (error) {
    console.error("[Avis] Erreur :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
