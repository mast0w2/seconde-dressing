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
import { Leaf } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-noir rounded-full flex items-center justify-center">
              <Leaf className="h-4 w-4 text-noir" />
            </div>
            <span className="text-xl font-bold text-noir tracking-wide">SECONDE</span>
          </Link>

          <div className="hidden md:flex md:gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-noir ${
                pathname === "/" ? "text-noir" : "text-gris-moyen"
              }`}
            >
              ACCUEIL
            </Link>
            <Link
              href="/concept"
              className={`text-sm font-medium transition-colors hover:text-noir ${
                pathname === "/concept" ? "text-noir" : "text-gris-moyen"
              }`}
            >
              NOTRE CONCEPT
            </Link>
            <Link
              href="/impact"
              className={`text-sm font-medium transition-colors hover:text-noir ${
                pathname === "/impact" ? "text-noir" : "text-gris-moyen"
              }`}
            >
              NOTRE IMPACT
            </Link>
            <Link
              href="/reviews"
              className={`text-sm font-medium transition-colors hover:text-noir ${
                pathname === "/reviews" ? "text-noir" : "text-gris-moyen"
              }`}
            >
              AVIS CLIENTS
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors hover:text-noir ${
                pathname === "/contact" ? "text-noir" : "text-gris-moyen"
              }`}
            >
              CONTACT
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full border border-noir/20"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.photo_url || undefined} />
                      <AvatarFallback className="bg-noir text-blanc text-xs font-bold">
                        {profile?.prenom ? profile.prenom.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-blanc border border-noir/10" align="end" forceMount>
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
                className="text-noir hover:bg-noir/5 hover:text-noir transition-colors"
              >
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button
                asChild
                className="bg-noir hover:bg-gris-fonce text-blanc px-6 py-2 text-sm font-medium transition-colors"
              >
                <Link href="/signup">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
