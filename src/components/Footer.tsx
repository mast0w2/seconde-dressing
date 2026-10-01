import Link from "next/link";
import { Button } from "./ui/button";
import { Logo } from "@/components/Logo";
import { CookieSettingsButton } from "@/components/CookieConsent";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/concept", label: "Notre concept" },
  { href: "/impact", label: "Économie circulaire" },
  { href: "/reviews", label: "Avis" },
  { href: "/contact", label: "Contact" },
  { href: "/signup?vendeur=true", label: "Devenir vendeuse" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "CGU / CGV" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/legal-notice", label: "Mentions légales" },
];

const LEGAL_LINK = "text-xs sm:text-sm text-gris-moyen underline-offset-4 hover:text-noir hover:underline";

export function Footer() {
  return (
    <footer className="border-t border-noir/10 bg-blanc py-8 sm:py-12">
      <div className="container flex flex-col items-center gap-8">
        {/* Logo and description - centered on all screens */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <Logo layout="stack" markClassName="h-12 sm:h-14" wordClassName="text-xl sm:text-2xl" />
          <p className="text-sm sm:text-base text-gris-moyen max-w-md">
            Plateforme de revente de vêtements entre particuliers et vendeuses professionnelles.
          </p>
        </div>

        {/* Navigation links - centered and wrapped on mobile */}
        <nav aria-label="Pied de page" className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-gris-moyen hover:text-noir hover:bg-noir/5 px-3 sm:px-4"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>

      <div className="border-t border-noir/10 mt-8 sm:mt-12 pt-6 sm:pt-8">
        <div className="container flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gris-moyen">
            © {new Date().getFullYear()} Seconde. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={LEGAL_LINK}>
                {link.label}
              </Link>
            ))}
            <CookieSettingsButton className={LEGAL_LINK} />
          </div>
        </div>
      </div>
    </footer>
  );
}
