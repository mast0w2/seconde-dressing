"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressiveEstimationForm } from "@/components/Form/ProgressiveEstimationForm";
import { Clock, Euro, Calendar, Truck, Sparkles, Leaf } from "lucide-react";

// ============================================================================
// Data
// ============================================================================

const BENEFITS = [
  {
    icon: Clock,
    title: "Gain de temps",
    text: "Plus besoin de gérer les annonces, les rendez-vous ou les négociations.",
  },
  {
    icon: Euro,
    title: "Gagner de l'argent",
    text: "Vos vêtements sont vendus au meilleur prix, et vous récupérez une part de chaque vente.",
  },
  {
    icon: Calendar,
    title: "Flexibilité",
    text: "Choisissez le moment qui vous convient pour les rendez-vous.",
  },
  {
    icon: Truck,
    title: "Service clé en main",
    text: "Récupération, photographie, mise en ligne et vente : on s'occupe de tout.",
  },
  {
    icon: Sparkles,
    title: "Expertise",
    text: "Profitez de l'expertise d'une vendeuse spécialisée qui saura vous conseiller, estimer, préparer et vendre vos pièces au meilleur prix.",
  },
  {
    icon: Leaf,
    title: "Durabilité",
    text: "Une seconde vie pour vos vêtements, c'est une mode plus durable et responsable.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Prenez rendez-vous",
    text: "Remplissez le formulaire pour qu'on vous contacte.",
  },
  {
    n: "02",
    title: "Contact rapide",
    text: "On vous recontacte dans les 24 heures pour organiser la collecte.",
  },
  {
    n: "03",
    title: "Récupération à domicile",
    text: "Nous venons chercher vos vêtements directement chez vous.",
  },
  {
    n: "04",
    title: "Mise en vente",
    text: "Vos pièces sont photographiées, décrites et mises en ligne sur nos plateformes partenaires.",
  },
  {
    n: "05",
    title: "Paiement",
    text: "Vous recevez votre part sur votre compte bancaire après la vente.",
  },
];

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-creme text-noir">
      {/* ================= HERO ================= */}
      <section className="px-6 sm:px-10 lg:px-[76px] pt-8 sm:pt-10 pb-16 sm:pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_470px] gap-10 lg:gap-16 items-center">
          <div className="flex flex-col gap-6 sm:gap-7">
            <div className="eyebrow">Conciergerie de seconde main</div>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.12]">
              On vous aide à vendre vos vêtements,
              <br />
              <span className="italic text-sauge-fonce">donnez-leur une seconde vie.</span>
            </h1>
            <p className="text-base sm:text-lg text-gris-moyen max-w-[480px]">
              Vous nous ouvrez votre dressing. On vient jusqu&apos;à vous, on trie, on
              photographie, on vend. Vous n&apos;avez rien à gérer.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-sauge-fonce">
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-sauge-clair" strokeWidth={1.5} />
                Sans effort
              </span>
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-sauge-clair" strokeWidth={1.5} />
                En gagnant de l&apos;argent
              </span>
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-sauge-clair" strokeWidth={1.5} />
                Grâce à l&apos;économie circulaire
              </span>
            </div>

            <div className="flex items-center gap-5 mt-1">
              <Button
                onClick={scrollToForm}
                className="bg-noir hover:bg-transparent hover:text-noir border border-noir text-blanc rounded-none px-8 py-6 text-[11px] tracking-[0.2em] uppercase"
              >
                Demandez un rendez-vous
              </Button>
              <span className="text-xs text-gris-moyen">Réponse sous 24 h · Gratuit</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-6 -top-6 -bottom-10 bg-sauge-clair/45 rounded-[240px_240px_40px_40px]" />
            <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[520px] rounded-[235px_235px_16px_16px] overflow-hidden">
              <Image
                src="/dressing-sort-1.jpg"
                alt="Deux femmes trient des vêtements devant un portant"
                fill
                sizes="(max-width: 1024px) 100vw, 470px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= NOTRE CONCEPT ================= */}
      <section id="concept" className="bg-gris-clair py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-[76px] grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-10 lg:gap-16 items-center">
          <div className="relative w-full h-[300px] sm:h-[380px] lg:h-[420px] rounded-xl overflow-hidden">
            <Image
              src="/dressing-sort-3.jpg"
              alt="Des mains plient des pulls sur une table en bois"
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <div className="eyebrow">Notre concept</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">
              Confiez-nous vos vêtements, on s&apos;occupe du reste.
            </h2>
            <p className="text-base text-gris-moyen max-w-[460px]">
              Chaque pièce est triée, photographiée et décrite à la main, puis mise en vente sur
              nos plateformes partenaires. Pas d&apos;annonces à rédiger, pas de rendez-vous à
              gérer, pas de négociations.
            </p>
            <p className="text-base text-gris-moyen max-w-[460px]">
              Vous récupérez une part du prix de vente de chaque article. Ce qui ne se vend pas
              vous revient, ou part vers nos filières de réemploi.
            </p>
          </div>
        </div>
      </section>

      {/* ================= POURQUOI CHOISIR SECONDE ================= */}
      <section id="pourquoi" className="px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-14">
            <h2 className="text-4xl sm:text-5xl">Pourquoi choisir Seconde ?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-gris-tres-clair border border-gris-clair p-8 flex flex-col gap-3.5"
              >
                <Icon className="h-7 w-7 text-sauge" strokeWidth={1.4} />
                <h3 className="text-xl">{title}</h3>
                <p className="text-gris-moyen text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA FONCTIONNE ================= */}
      <section id="etapes" className="bg-noir text-creme py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-[76px] grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-3.5">
            <h2 className="text-3xl sm:text-4xl text-creme mb-4">Comment ça fonctionne ?</h2>

            <div className="flex flex-col">
              {STEPS.map((step, i) => (
                <div
                  key={step.n}
                  className={`grid grid-cols-[52px_1fr] sm:grid-cols-[62px_1fr] gap-4 sm:gap-5 py-5 ${
                    i < STEPS.length - 1 ? "border-b border-[#46523f]" : ""
                  }`}
                >
                  <div className="font-serif text-3xl leading-none text-sauge-clair">{step.n}</div>
                  <div>
                    <h3 className="text-lg sm:text-xl text-creme mb-1">{step.title}</h3>
                    <p className="text-[#b9c2b0] text-sm">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[480px] rounded-[200px_200px_12px_12px] overflow-hidden">
              <Image
                src="/dressing-sort-2.jpg"
                alt="Une femme choisit une robe dans son dressing"
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            </div>
            <p className="font-serif italic text-lg sm:text-xl text-[#c3cbb9] leading-relaxed">
              « Vos vêtements méritent une seconde histoire. »
            </p>
          </div>
        </div>
      </section>

      {/* ================= CE QUE VOUS TOUCHEZ ================= */}
      <section
        id="remuneration"
        className="bg-gris-clair px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-5 max-w-[480px]">
            <div className="eyebrow">Ce que vous touchez</div>
            <h2 className="text-3xl sm:text-4xl leading-[1.18]">
              Vous touchez 50 % de chaque vente.
            </h2>
            <p className="text-base text-gris-moyen">
              Votre vendeuse en reçoit 40 % : c&apos;est elle qui trie, photographie, rédige les
              annonces, répond aux acheteurs et expédie. Les 10 % restants font tourner Seconde —
              la plateforme, le suivi de vos ventes et les paiements.
            </p>
            <p className="text-base text-gris-moyen">
              Pas de frais cachés. Seul le rendez-vous est facturé, de 10 à 50 € selon la formule
              choisie. Ce qui ne se vend pas vous revient, ou part vers nos filières de réemploi.
            </p>
          </div>
        </div>
      </section>

      {/* ================= DEMANDEZ UN RENDEZ-VOUS ================= */}
      <section
        ref={formRef}
        id="estimation-form"
        className="border-t border-noir/10 px-6 sm:px-10 lg:px-[76px] py-16 sm:py-20 lg:py-24"
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <ProgressiveEstimationForm />
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-x-[-28px] top-[30px] bottom-[-26px] bg-sauge-clair/45 rounded-xl" />
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
              <Image
                src="/dressing-sort-4.jpg"
                alt="Une cliente confie un sac de vêtements"
                fill
                sizes="440px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
