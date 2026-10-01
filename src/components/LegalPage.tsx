import Link from "next/link";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

// Shared layout of the legal pages (terms, privacy policy, legal notice):
// one readable column, numbered sections, a table of contents.

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}

const LEGAL_LINKS = [
  { href: "/terms", label: "Conditions générales" },
  { href: "/privacy", label: "Politique de confidentialité" },
  { href: "/legal-notice", label: "Mentions légales" },
];

export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <div className="bg-creme text-noir">
      <article className="px-6 sm:px-10 lg:px-[76px] pt-12 sm:pt-16 pb-16 sm:pb-24">
        <div className="max-w-[760px] mx-auto flex flex-col gap-10">
          <header className="flex flex-col gap-5">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="text-4xl sm:text-5xl leading-[1.14]">{title}</h1>
            <p className="text-sm text-gris-moyen">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
            {intro && <div className="text-base sm:text-lg text-gris-moyen">{intro}</div>}
          </header>

          <nav aria-label="Sommaire" className="border-y border-noir/10 py-6">
            <ol className="flex flex-col gap-2 text-sm">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sauge-fonce underline-offset-4 hover:underline hover:text-noir"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 flex flex-col gap-4">
              <h2 className="text-2xl sm:text-3xl">
                {i + 1}. {section.title}
              </h2>
              <div className="legal-prose flex flex-col gap-4 text-base text-gris-moyen">
                {section.content}
              </div>
            </section>
          ))}

          <footer className="border-t border-noir/10 pt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sauge-fonce underline underline-offset-4 hover:text-noir"
              >
                {link.label}
              </Link>
            ))}
          </footer>
        </div>
      </article>
    </div>
  );
}
