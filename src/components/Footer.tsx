import Link from "next/link";
import { Button } from "./ui/button";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-noir/10 bg-blanc py-12">
      <div className="container flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex flex-col items-center gap-6 px-8 md:flex-row md:gap-8 md:px-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-noir rounded-full flex items-center justify-center">
              <Leaf className="h-5 w-5 text-noir" />
            </div>
            <span className="text-xl font-bold text-noir tracking-wide">SECONDE</span>
          </div>
          <p className="text-center text-sm text-gris-moyen max-w-md md:text-left">
            Plateforme de revente de vêtements entre particuliers et vendeuses professionnelles.
          </p>
        </div>

        <div className="flex gap-6">
          <Button asChild variant="ghost" size="sm" className="text-gris-moyen hover:text-noir hover:bg-noir/5">
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-gris-moyen hover:text-noir hover:bg-noir/5">
            <Link href="/concept">Notre concept</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-gris-moyen hover:text-noir hover:bg-noir/5">
            <Link href="/impact">Notre impact</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-gris-moyen hover:text-noir hover:bg-noir/5">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-noir/10 mt-12 pt-8">
        <div className="container flex items-center justify-center">
          <p className="text-sm text-gris-moyen">
            © {new Date().getFullYear()} Seconde. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
