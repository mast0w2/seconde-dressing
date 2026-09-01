import Link from "next/link";
import { Button } from "./ui/button";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-noir/10 bg-blanc py-8 sm:py-12">
      <div className="container flex flex-col items-center gap-8">
        {/* Logo and description - centered on all screens */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border border-noir rounded-full flex items-center justify-center">
              <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-noir" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-noir tracking-wide">SECONDE</span>
          </div>
          <p className="text-sm sm:text-base text-gris-moyen max-w-md">
            Plateforme de revente de vêtements entre particuliers et vendeuses professionnelles.
          </p>
        </div>

        {/* Navigation links - centered and wrapped on mobile */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm text-gris-moyen hover:text-noir hover:bg-noir/5 px-3 sm:px-4">
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm text-gris-moyen hover:text-noir hover:bg-noir/5 px-3 sm:px-4">
            <Link href="/concept">Notre concept</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm text-gris-moyen hover:text-noir hover:bg-noir/5 px-3 sm:px-4">
            <Link href="/impact">Économie circulaire</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm text-gris-moyen hover:text-noir hover:bg-noir/5 px-3 sm:px-4">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-noir/10 mt-8 sm:mt-12 pt-6 sm:pt-8">
        <div className="container flex items-center justify-center">
          <p className="text-xs sm:text-sm text-gris-moyen">
            © {new Date().getFullYear()} Seconde. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
