"use client";

import { useRef } from "react";
import { ProgressiveEstimationForm } from "@/components/Form/ProgressiveEstimationForm";
import { Button } from "@/components/ui/button";
import type { CityData } from "@/lib/cities";

export default function CityPageContent({ city }: { city: CityData }) {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const ctaText = city.slug.startsWith("conciergerie")
    ? city.title.replace(/^Conciergerie seconde main à /, "")
    : "Paris";

  return (
    <div className="bg-creme text-noir">
      <section className="px-6 sm:px-10 lg:px-[76px] pt-10 sm:pt-14 pb-14 sm:pb-20">
        <div className="max-w-[820px] mx-auto flex flex-col gap-6">
          <div className="eyebrow">Conciergerie de seconde main</div>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.15]">
            {city.h1}
          </h1>
          <p className="text-base sm:text-lg text-gris-moyen max-w-[640px]">
            {city.intro}
          </p>
          <div>
            <Button
              onClick={scrollToForm}
              className="bg-noir hover:bg-transparent hover:text-noir border border-noir text-blanc rounded-none px-8 py-6 text-[11px] tracking-[0.2em] uppercase"
            >
              Demandez un rendez-vous
            </Button>
          </div>
        </div>
      </section>

      {city.sections.map((section) => (
        <section
          key={section.heading}
          className="px-6 sm:px-10 lg:px-[76px] py-12 sm:py-16 border-t border-noir/10"
        >
          <div className="max-w-[820px] mx-auto flex flex-col gap-5">
            <h2 className="text-2xl sm:text-3xl leading-[1.2]">{section.heading}</h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-base text-gris-moyen leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ol className="flex flex-col gap-3 list-decimal list-inside text-base text-gris-moyen">
                {section.list.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      ))}

      <section
        ref={formRef}
        id="estimation-form"
        className="border-t border-noir/10 px-6 sm:px-10 lg:px-[76px] py-14 sm:py-20"
      >
        <div className="max-w-[820px] mx-auto flex flex-col gap-6">
          <div className="text-center flex flex-col gap-4">
            <div className="eyebrow">Demandez votre rendez-vous gratuit</div>
            <h2 className="text-3xl sm:text-4xl">
              On vient chez vous à {ctaText}
            </h2>
            <p className="text-base text-gris-moyen">
              Remplissez le formulaire, on vous recontacte dans les 24 heures pour
              organiser la collecte à votre domicile à {ctaText}.
            </p>
          </div>
          <ProgressiveEstimationForm />
        </div>
      </section>
    </div>
  );
}
