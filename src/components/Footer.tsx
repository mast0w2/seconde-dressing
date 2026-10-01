import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CookieSettingsButton } from "@/components/CookieConsent";

// Site navigation lives in the header menu; the footer only carries the
// brand and the links the law requires on every page.
const LEGAL_LINKS = [
  { href: "/terms", label: "CGU / CGV" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/legal-notice", label: "Mentions légales" },
];

const LEGAL_LINK = "text-xs sm:text-sm text-gris-moyen underline-offset-4 hover:text-noir hover:underline";

export function Footer() {
  return (
    <footer className="border-t border-noir/10 bg-blanc py-8 sm:py-12">
      <div className="container flex flex-col items-center gap-6 sm:gap-8 text-center">
        <Logo layout="stack" markClassName="h-12 sm:h-14" wordClassName="text-xl sm:text-2xl" />
        <p className="text-sm sm:text-base text-gris-moyen max-w-md">
          Plateforme de revente de vêtements entre particuliers et vendeuses professionnelles.
        </p>
        <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={LEGAL_LINK}>
              {link.label}
            </Link>
          ))}
          <CookieSettingsButton className={LEGAL_LINK} />
        </nav>
        <p className="text-xs sm:text-sm text-gris-moyen">
          © {new Date().getFullYear()} Seconde. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
