"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
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

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => {
        await checkUser();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bienvenue sur Seconde Dressing
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              La plateforme qui connecte les clients avec des vendeuses professionnelles pour vendre vos vêtements.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/signup">S&apos;inscrire</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href={`/${profile?.role}/dashboard`}>
                    Tableau de bord
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Client Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👗</span>
                  Je suis un client
                </CardTitle>
                <CardDescription>
                  Vous voulez vendre vos vêtements ?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Prendre un rendez-vous avec une vendeuse</li>
                  <li>• Gérer vos disponibilités</li>
                  <li>• Suivre vos rendez-vous</li>
                  <li>• Recevoir des notifications</li>
                </ul>
                {user && profile?.role === "client" && (
                  <Button className="w-full mt-4" asChild>
                    <Link href="/client/rdv">Mes rendez-vous</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Vendeuse Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👩‍💼</span>
                  Je suis une vendeuse
                </CardTitle>
                <CardDescription>
                  Vous êtes une vendeuse professionnelle ?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Recevoir des demandes de rendez-vous</li>
                  <li>• Accepter ou refuser les demandes</li>
                  <li>• Gérer votre agenda</li>
                  <li>• Suivre vos clients</li>
                </ul>
                {user && profile?.role === "vendeuse" && (
                  <Button className="w-full mt-4" asChild>
                    <Link href="/vendeuse/demandes">Voir les demandes</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pourquoi choisir Seconde Dressing ?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Interface simple et intuitive</li>
                  <li>• Notifications en temps réel</li>
                  <li>• Gestion complète des rendez-vous</li>
                  <li>• Sécurisé et confidentiel</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Inscrivez-vous dès maintenant et commencez à utiliser Seconde Dressing.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/signup">Créer mon compte</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">J&apos;ai déjà un compte</Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="lg">
                <Link href={`/${profile?.role}/dashboard`}>
                  Accéder à mon espace
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
