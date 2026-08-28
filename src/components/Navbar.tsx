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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Seconde Dressing</span>
          </Link>

          <div className="hidden md:flex md:gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Accueil
            </Link>

            {user && (
              <>
                {isClient && (
                  <>
                    <Link
                      href="/client/disponibilites"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname.startsWith("/client/disponibilites")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Mes disponibilités
                    </Link>
                    <Link
                      href="/client/rdv"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname.startsWith("/client/rdv")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Mes rendez-vous
                    </Link>
                  </>
                )}

                {isVendeuse && (
                  <>
                    <Link
                      href="/vendeuse/demandes"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname.startsWith("/vendeuse/demandes")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Demandes
                    </Link>
                    <Link
                      href="/vendeuse/agenda"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname.startsWith("/vendeuse/agenda")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Mon agenda
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {profile?.photo_url ? (
                        <AvatarImage
                          src={profile.photo_url}
                          alt={profile.prenom}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.prenom?.charAt(0) || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.prenom} {profile?.nom}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${profile?.role}/settings`}>Paramètres</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">S&apos;inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
