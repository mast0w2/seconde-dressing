"use client";

import Link from "next/link";
import { Star, MessageCircle, ShieldCheck } from "lucide-react";
import { AVIS, noteMoyenne, formaterMois, formaterJour } from "@/data/avis";

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
  // Les avis les plus récents d'abord.
  const avis = [...AVIS].sort((a, b) => b.datePublication.localeCompare(a.datePublication));
  const moyenne = noteMoyenne(avis);

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
          <p className="text-base sm:text-lg text-gris-moyen">
            Chaque avis publié ici vient d&apos;une cliente à qui nous avons réellement vendu des
            vêtements. Nous les sollicitons par email à la fin de la vente, et nous publions ce
            qu&apos;elles écrivent — sans trier.
          </p>

          {avis.length > 0 && (
            <div className="flex items-center gap-4 border-t border-noir/10 pt-6">
              <span className="font-serif text-4xl leading-none text-noir">
                {moyenne.toFixed(1).replace(".", ",")}
              </span>
              <div className="flex flex-col gap-1">
                <Etoiles note={moyenne} taille={16} />
                <span className="text-sm text-gris-moyen">
                  {avis.length} avis {avis.length > 1 ? "publiés" : "publié"} · du plus récent au
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
          {avis.length === 0 ? (
            <div className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-5 bg-gris-tres-clair border border-noir/10 p-10 sm:p-12">
              <MessageCircle className="h-8 w-8 text-sauge" strokeWidth={1.3} />
              <h2 className="text-2xl sm:text-3xl">Les premiers avis arrivent bientôt.</h2>
              <p className="text-gris-moyen">
                Nous venons d&apos;ouvrir. Dès que les premières ventes seront conclues, les clientes
                concernées recevront une invitation à donner leur avis, et il apparaîtra ici tel
                qu&apos;elles l&apos;auront écrit.
              </p>
              <Link
                href="/#estimation-form"
                className="mt-2 bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
              >
                Demander un rendez-vous
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {avis.map((a) => (
                <figure
                  key={a.id}
                  className="bg-gris-tres-clair border border-noir/10 p-8 flex flex-col gap-4"
                >
                  <Etoiles note={a.note} />
                  <blockquote className="font-serif text-xl leading-snug text-noir">
                    « {a.texte} »
                  </blockquote>
                  <figcaption className="mt-auto pt-4 border-t border-noir/10 flex flex-col gap-1 text-sm text-gris-moyen">
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
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= COMMENT NOUS RECUEILLONS LES AVIS ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[820px] mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 shrink-0 text-sauge" strokeWidth={1.3} />
            <h2 className="text-2xl sm:text-3xl">Comment nous recueillons ces avis</h2>
          </div>
          <div className="flex flex-col gap-4 text-base text-gris-moyen">
            <p>
              Nous écrivons à chaque cliente une fois ses pièces vendues et son virement effectué,
              en lui proposant de donner son avis. Seules les personnes ayant réellement bénéficié
              du service peuvent en laisser un : nous ne publions aucun avis venu d&apos;ailleurs.
            </p>
            <p>
              Nous vérifions que l&apos;avis correspond bien à une prestation figurant dans nos
              dossiers, puis nous le publions tel qu&apos;il a été écrit, sans le reformuler et sans
              rien retirer. Les avis sont affichés du plus récent au plus ancien, avec le mois de la
              prestation et la date de mise en ligne.
            </p>
            <p>
              Un avis n&apos;est écarté que s&apos;il est injurieux, diffamatoire ou manifestement
              étranger au service — et son autrice en est alors informée. Nous ne supprimons jamais
              un avis au motif qu&apos;il est négatif, et aucune contrepartie n&apos;est offerte en
              échange d&apos;un avis.
            </p>
            <p>
              Seuls le prénom et la ville sont publiés. Chaque cliente peut à tout moment demander
              la modification ou le retrait de son avis via{" "}
              <Link
                href="/contact"
                className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
              >
                notre formulaire de contact
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ================= APPEL À L'ACTION ================= */}
      {avis.length > 0 && (
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
              href="/#estimation-form"
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
