"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Check } from "lucide-react";
import { HoneypotField, spamTrapFields, useFormStartedAt } from "@/components/HoneypotField";
import { EMAIL_REGEX, FIELD_MAX } from "@/lib/form-limits";

const LABEL = "text-[10px] tracking-[0.22em] uppercase text-gris-moyen";
const CHAMP =
  "w-full bg-transparent border-0 border-b border-noir/20 py-3 text-base text-noir placeholder:text-gris-moyen focus:outline-none focus:border-sauge-fonce transition-colors";

const VIDE = {
  prenom: "",
  nom: "",
  email: "",
  ville: "",
  note: 0,
  texte: "",
  consentement: false,
};

export default function LeaveReviewPage() {
  const [form, setForm] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useFormStartedAt();

  // Liste, en clair, ce qu'il reste à remplir. Un message générique ne dit pas
  // à la cliente quel champ bloque : elle abandonne.
  const manquants: string[] = [];
  if (form.note < 1) manquants.push("une note en étoiles");
  if (form.texte.trim().length < 5) manquants.push("votre avis");
  if (form.prenom.trim() === "") manquants.push("votre prénom");
  if (form.nom.trim() === "") manquants.push("votre nom");
  if (!EMAIL_REGEX.test(form.email.trim())) manquants.push("un email valide");
  if (!form.consentement) manquants.push("l'autorisation de publication");
  const valide = manquants.length === 0;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!valide) {
      const liste =
        manquants.length === 1
          ? manquants[0]
          : `${manquants.slice(0, -1).join(", ")} et ${manquants[manquants.length - 1]}`;
      setErreur(`Il manque encore ${liste}.`);
      return;
    }

    setEnvoi(true);
    try {
      const reponse = await fetch("/api/reviews/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          email: form.email.trim(),
          ville: form.ville.trim(),
          note: form.note,
          texte: form.texte.trim(),
          consentement: form.consentement,
          ...spamTrapFields(honeypot, startedAt),
        }),
      });

      if (!reponse.ok) throw new Error("Envoi impossible");
      setEnvoye(true);
    } catch {
      setErreur(
        "L'envoi n'a pas fonctionné. Réessayez dans un instant, ou écrivez-nous directement."
      );
    } finally {
      setEnvoi(false);
    }
  };

  if (envoye) {
    return (
      <div className="bg-creme text-noir">
        <section className="px-6 sm:px-10 lg:px-[76px] py-20 sm:py-24">
          <div className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-5 bg-gris-tres-clair border border-noir/10 p-10 sm:p-12">
            <Check className="h-8 w-8 text-sauge" strokeWidth={1.3} />
            <h1 className="text-3xl sm:text-4xl">Merci beaucoup.</h1>
            <p className="text-gris-moyen">
              Votre avis nous est bien parvenu. Nous le publierons tel que vous l&apos;avez écrit,
              avec votre prénom seul, dans les prochains jours. Vous pouvez à tout moment nous
              demander de le modifier ou de le retirer.
            </p>
            <Link
              href="/reviews"
              className="mt-2 bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
            >
              Voir les avis
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-creme text-noir">
      <section className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-[620px] mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <div className="eyebrow">Votre avis</div>
            <h1 className="text-4xl sm:text-5xl leading-[1.14]">
              Vos pièces sont vendues.
              <br />
              <span className="italic text-sauge-fonce">Dites-nous comment ça s&apos;est passé.</span>
            </h1>
            <p className="text-base text-gris-moyen">
              Votre avis sera publié sur notre page d&apos;avis, tel que vous l&apos;écrivez, avec votre
              prénom seul. Deux minutes, et vous aidez les prochaines clientes à savoir à quoi
              s&apos;attendre.
            </p>
          </div>

          <form onSubmit={envoyer} noValidate className="flex flex-col gap-8">
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <div className="flex flex-col gap-3">
              <span id="note-label" className={LABEL}>Votre note *</span>
              <div role="group" aria-labelledby="note-label" className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, note: i })}
                    aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                    aria-pressed={form.note === i}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={i <= form.note ? "fill-sauge-fonce text-sauge-fonce" : "text-sauge-clair"}
                      style={{ width: 30, height: 30 }}
                      strokeWidth={1.3}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="texte" className={LABEL}>
                Votre avis *
              </label>
              <textarea
                id="texte"
                rows={5}
                maxLength={FIELD_MAX.shortText}
                value={form.texte}
                onChange={(e) => setForm({ ...form, texte: e.target.value })}
                placeholder="Ce qui vous a plu, ce qui pourrait être mieux, ce que vous diriez à une amie…"
                className={`${CHAMP} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex flex-col gap-2">
                <label htmlFor="prenom" className={LABEL}>
                  Prénom * <span className="normal-case tracking-normal">(publié)</span>
                </label>
                <input
                  id="prenom"
                  type="text"
                  autoComplete="given-name"
                  maxLength={FIELD_MAX.name}
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className={CHAMP}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="nom" className={LABEL}>
                  Nom * <span className="normal-case tracking-normal">(jamais publié)</span>
                </label>
                <input
                  id="nom"
                  type="text"
                  autoComplete="family-name"
                  maxLength={FIELD_MAX.name}
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className={CHAMP}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={LABEL}>
                  Email * <span className="normal-case tracking-normal">(jamais publié)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={FIELD_MAX.email}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={CHAMP}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="ville" className={LABEL}>
                  Ville <span className="normal-case tracking-normal">(facultatif)</span>
                </label>
                <input
                  id="ville"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={FIELD_MAX.city}
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  placeholder="Paris 11e"
                  className={CHAMP}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer border border-noir/10 bg-gris-tres-clair p-5">
              <input
                type="checkbox"
                checked={form.consentement}
                onChange={(e) => setForm({ ...form, consentement: e.target.checked })}
                className="mt-1 h-4 w-4 shrink-0 accent-[#5b6e49]"
              />
              <span className="text-sm text-gris-moyen">
                J&apos;autorise Seconde à publier cet avis sur son site avec mon prénom et ma ville.
                Mon nom et mon email ne seront pas publiés et servent uniquement à vérifier que
                l&apos;avis provient bien d&apos;une cliente. Je peux demander sa modification ou son
                retrait à tout moment (
                <Link href="/privacy" className="text-sauge-fonce underline underline-offset-4 hover:text-noir">
                  politique de confidentialité
                </Link>
                ).
              </span>
            </label>

            {erreur && (
              <p role="alert" className="text-sm text-destructive">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi}
              className="self-start bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors disabled:opacity-50"
            >
              {envoi ? "Envoi en cours…" : "Envoyer mon avis"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
