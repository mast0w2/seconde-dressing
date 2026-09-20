"use client";

import Link from "next/link";
import { Star, MessageCircle } from "lucide-react";
import { AVIS, noteMoyenne, formaterMois, formaterJour } from "@/data/reviews";

function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: taille, height: taille }}
          strokeWidth={1.3}
          className={i <= Math.round(note) ? "fill-sauge text-sauge" : "text-sauge-clair"}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  // Les reviews les plus récents d'abord.
  const reviews = [...AVIS].sort((a, b) => b.datePublication.localeCompare(a.datePublication));
  const moyenne = noteMoyenne(reviews);

  return (
    <div className="bg-creme text-noir">
      {/* ================= INTRODUCTION ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-12 sm:pb-14">
        <div className="max-w-[820px] mx-auto flex flex-col gap-6">
          <div className="eyebrow">Avis clientes</div>
          <h1 className="text-4xl sm:text-5xl leading-[1.14]">
            Ce qu&apos;elles en disent,
            <br />
            <span className="italic text-sauge-fonce">une fois leurs pièces vendues.</span>
          </h1>
          <p>
            Chaque reviews publié ici vient d&apos;une cliente à qui nous avons réellement vendu des
            vêtements. Nous les sollicitons par email à la fin de la vente, et nous publions ce
            qu&apos;elles écrivent — sans trier.
          </p>

          {reviews.length > 0 && (
            <div className="flex items-center gap-4 border-t border-noir/10 pt-6">
              <span className="font-serif text-4xl leading-none text-noir">
                {moyenne.toFixed(1).replace(".", ",")}
              </span>
              <div className="flex flex-col gap-1">
                <Etoiles note={moyenne} taille={16} />
                <span className="text-sm text-gris-moyen">
                  {reviews.length} reviews {reviews.length > 1 ? "publiés" : "publié"} · du plus récent au
                  plus ancien
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= LES AVIS ================= */}
      <section className="bg-gris-clair px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          {reviews.length === 0 ? (
            <div className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-5 bg-gris-tres-clair border border-noir/10 p-10 sm:p-12">
              <MessageCircle className="h-8 w-8 text-sauge" strokeWidth={1.3} />
              <h2 className="text-2xl sm:text-3xl">Les premiers reviews arrivent bientôt.</h2>
              <p className="text-gris-moyen">
                Nous venons d&apos;ouvrir. Dès que les premières ventes seront conclues, les clientes
                concernées recevront une invitation à donner leur reviews, et il apparaîtra ici tel
                qu&apos;elles l&apos;auront écrit.
              </p>
              <Link
                href="/#appointment-request-form"
                className="mt-2 bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
              >
                Demander un rendez-vous
              </Link>
            </div>
          ) : (
            <div className="max-w-[820px] mx-auto flex flex-col gap-6">
              {reviews.map((a) => {
                const initials = a.prenom.replace(/\s+/g, "").substring(0, 2).toUpperCase();
                return (
                  <figure
                    key={a.id}
                    className="bg-gris-tres-clair border border-noir/10 p-8 flex flex-col gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-sauge text-creme flex items-center justify-center font-serif font-medium text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col gap-4 flex-1">
                        <Etoiles note={a.note} />
                        <blockquote className="font-serif text-xl leading-snug text-noir">
                          « {a.texte} »
                        </blockquote>
                      </div>
                    </div>
                    <figcaption className="pt-4 border-t border-noir/10 flex flex-col gap-1 text-sm text-gris-moyen">
                      <span className="text-noir">
                        {a.prenom}
                        {a.ville ? ` · ${a.ville}` : ""}
                      </span>
                      <span className="text-[13px]">
                        Prestation de {formaterMois(a.dateExperience)} · publié le{" "}
                        {formaterJour(a.datePublication)}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= APPEL À L'ACTION ================= */}
      {reviews.length > 0 && (
        <section className="bg-noir text-creme px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
          <div className="max-w-[720px] mx-auto text-center flex flex-col items-center gap-6">
            <div className="eyebrow text-sauge-clair">À votre tour</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">
              Videz votre dressing, sans effort.
            </h2>
            <p className="text-base text-creme/75 max-w-[520px]">
              Quelques questions, moins d&apos;une minute, et on vous recontacte sous 24 heures.
            </p>
            <Link
              href="/#appointment-request-form"
              className="mt-2 bg-creme text-noir border border-creme px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-creme transition-colors"
            >
              Demander un rendez-vous
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
