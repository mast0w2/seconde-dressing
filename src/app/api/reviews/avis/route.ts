// src/app/api/reviews/avis/route.ts
//
// Receives a customer review. Deliberately WITHOUT a database: a review does
// not need to be stored to be useful, and depending on Supabase breaks the
// form whenever the local configuration is incomplete. The review arrives by
// email and is added by hand to src/data/reviews.ts after checking, so no
// review is ever published unchecked.

import { NextResponse } from "next/server";
import { emailService } from "@/lib/email";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { isLikelySpam } from "@/lib/spam";
import { EMAIL_REGEX, FIELD_MAX } from "@/lib/form-limits";

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
  if (prenom.length > FIELD_MAX.name || nom.length > FIELD_MAX.name) erreurs.push("Nom trop long");
  if (email.length > FIELD_MAX.email) erreurs.push("Email trop long");
  if (ville.length > FIELD_MAX.city) erreurs.push("Ville trop longue");
  if (reviewsTexte.length > FIELD_MAX.shortText)
    erreurs.push(`Avis trop long (${FIELD_MAX.shortText} caractères maximum)`);

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
 * Sans ce repli, l'avis partirait dans le vide sans que personne le sache.
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
    const body = await request.json();

    // Bots get the same answer as people but nothing is sent.
    if (isLikelySpam(body)) {
      console.warn("[Avis] Submission dropped by the spam traps");
      return NextResponse.json({ success: true, envoye: false });
    }

    const validation = valider(body);
    if (!validation.ok) {
      return NextResponse.json({ success: false, errors: validation.erreurs }, { status: 400 });
    }

    const a = validation.reviews;

    const allowed = await allowRequest({
      key: `review:ip:${clientIp(request)}`,
      max: 5,
      windowSeconds: 3600,
    });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Trop d'avis envoyés. Merci de réessayer un peu plus tard." },
        { status: 429 }
      );
    }
    const message = corpsEmail(a);

    // The review is ALWAYS logged, whatever happens next: if the email fails,
    // it can still be recovered from the server logs. A customer review must
    // never get lost.
    console.log("[Avis] Avis reçu :\n" + message);

    const admins = destinataires();
    if (admins.length === 0) {
      console.error(
        "[Avis] Aucun destinataire configuré (CONTACT_ADMIN_EMAILS). L'avis n'a pas été envoyé par email."
      );
      return NextResponse.json({ success: true, envoye: false });
    }

    const html =
      "<h2>Nouvel avis cliente</h2><pre style=\"font-family:inherit;white-space:pre-wrap\">" +
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
