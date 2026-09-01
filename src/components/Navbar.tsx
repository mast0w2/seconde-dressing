"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "./ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Leaf, Menu, X, Users } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => {
        await getUser();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Déconnecté", description: "Vous avez été déconnecté." });
    router.push("/");
  };

  const isClient = profile?.role === "client";
  const isVendeuse = profile?.role === "vendeuse";

  return (
    <nav className="sticky top-0 z-50 w-full bg-blanc/95 backdrop-blur border-b border-noir/10">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Menu hamburger - extrême gauche sur tous les écrans */}
        <button
          className="p-2 rounded-md border border-noir/10 hover:bg-noir/5 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6 text-noir" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-noir" />}
        </button>

        {/* Logo SECONDE - centré */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-noir rounded-full flex items-center justify-center">
              <Leaf className="h-4 w-4 text-noir" />
            </div>
            <span className="text-xl font-bold text-noir tracking-wide">SECONDE</span>
          </Link>
        </div>

        {/* Icône de connexion - extrême droite */}
        <div className="flex items-center">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-noir/20"
                  >
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={profile?.photo_url || undefined} />
                      <AvatarFallback className="bg-noir text-blanc text-xs font-bold">
                        {profile?.prenom ? profile.prenom.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 sm:w-56 bg-blanc border border-noir/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal text-noir">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.prenom} {profile?.nom}</p>
                      <p className="text-xs text-gris-moyen">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-noir/10" />
                  <DropdownMenuItem asChild className="focus:bg-noir/5 focus:text-noir">
                    <Link href={isClient ? "/client/settings" : isVendeuse ? "/vendeuse/settings" : "/"}>
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  {isClient && (
                    <>
                      <DropdownMenuItem asChild className="focus:bg-noir/5 focus:text-noir">
                        <Link href="/client/disponibilites">Mes disponibilités</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="focus:bg-noir/5 focus:text-noir">
                        <Link href="/client/rdv">Mes rendez-vous</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isVendeuse && (
                    <>
                      <DropdownMenuItem asChild className="focus:bg-noir/5 focus:text-noir">
                        <Link href="/vendeuse/agenda">Mon agenda</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="focus:bg-noir/5 focus:text-noir">
                        <Link href="/vendeuse/demandes">Mes demandes</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-noir/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="focus:bg-noir/5 focus:text-noir text-destructive"
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full border border-noir/20"
                aria-label="Se connecter ou s'inscrire"
              >
                <Link href="/login">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-noir" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-blanc border-b border-noir/10 z-50">
            <div className="flex flex-col gap-3 p-4 sm:p-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-noir ${
                  pathname === "/" ? "text-noir" : "text-gris-moyen"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                ACCUEIL
              </Link>
              <Link
                href="/concept"
                className={`text-sm font-medium transition-colors hover:text-noir ${
                  pathname === "/concept" ? "text-noir" : "text-gris-moyen"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                NOTRE CONCEPT
              </Link>
              <Link
                href="/impact"
                className={`text-sm font-medium transition-colors hover:text-noir ${
                  pathname === "/impact" ? "text-noir" : "text-gris-moyen"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                ÉCONOMIE CIRCULAIRE
              </Link>
              <Link
                href="/reviews"
                className={`text-sm font-medium transition-colors hover:text-noir ${
                  pathname === "/reviews" ? "text-noir" : "text-gris-moyen"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                AVIS CLIENTS
              </Link>
              <Link
                href="/contact"
                className={`text-sm font-medium transition-colors hover:text-noir ${
                  pathname === "/contact" ? "text-noir" : "text-gris-moyen"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                CONTACT
              </Link>
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium transition-colors hover:text-noir text-gris-moyen"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium transition-colors hover:text-noir text-gris-moyen"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
