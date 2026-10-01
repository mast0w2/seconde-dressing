import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/concept", label: "Notre concept" },
  { href: "/reviews", label: "Les avis de nos clientes" },
  { href: "/contact", label: "Nous écrire" },
];

export default function NotFound() {
  return (
    <div className="bg-creme text-noir">
      <section className="px-6 sm:px-10 lg:px-[76px] py-20 sm:py-28">
        <div className="max-w-[640px] mx-auto flex flex-col items-center text-center gap-6">
          <LogoMark className="h-16 w-auto opacity-80" />
          <div className="eyebrow">Erreur 404</div>
          <h1 className="text-4xl sm:text-5xl leading-[1.14]">
            Cette page a déjà trouvé
            <br />
            <span className="italic text-sauge-fonce">une seconde vie ailleurs.</span>
          </h1>
          <p className="text-base sm:text-lg text-gris-moyen max-w-[480px]">
            Le lien est peut-être ancien, ou l&apos;adresse contient une faute de frappe. Pas
            d&apos;inquiétude, le reste du site est bien là.
          </p>

          <Link
            href="/#appointment-request-form"
            className="mt-2 inline-flex items-center justify-center bg-noir text-blanc border border-noir px-8 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:text-noir transition-colors"
          >
            Demander un rendez-vous
          </Link>

          <nav aria-label="Pages utiles" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <Link href="/" className="text-sauge-fonce underline underline-offset-4 hover:text-noir">
              Accueil
            </Link>
            {SUGGESTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-sauge-fonce underline underline-offset-4 hover:text-noir"
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
