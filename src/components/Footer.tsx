import Link from "next/link";
import { Button } from "./ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <span className="text-xl font-bold text-primary">Seconde Dressing</span>
          <p className="text-center text-sm leading-loose md:text-left">
            Plateforme de revente de vêtements entre particuliers et vendeuses professionnelles.
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#">Contact</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#">À propos</Link>
          </Button>
        </div>
      </div>

      <div className="border-t py-4">
        <div className="container flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Seconde Dressing. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
