"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Leaf, Users, Euro, Calendar, TrendingUp, ChevronRight } from "lucide-react";

export default function VendeurPage() {
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profile && profile.role === "vendeur") {
          setUser(currentUser);
          setProfile(profile);
        }
      }

      setIsLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-blanc text-noir">
      {/* Hero Section for Vendeur Landing Page */}
      <section 
        className="relative py-20 md:py-28 bg-creme"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-creme/70 backdrop-blur-sm"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-noir rounded-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-noir" />
            </div>
            <h1 className="text-4xl md:text-6xl font-700 text-noir mb-6 leading-tight">
              {profile ? `Bienvenue ${profile?.prenom} !` : "Devenez Vendeur Partenaire"}
            </h1>
            <p className="text-lg sm:text-xl text-gris-moyen mb-8 max-w-2xl mx-auto">
              {profile 
                ? "Gagnez de l'argent en aidant les clients à vendre leurs vêtements."
                : "Rejoignez notre réseau de vendeurs professionnels et bénéficiez de nombreux avantages"
              }
            </p>

            {profile ? (
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  className="bg-noir hover:bg-gris-fonce text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
                >
                  <Link href="/dashboard">
                    VOIR LES DEMANDES
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="border-noir text-noir hover:bg-noir hover:text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
                >
                  <Link href="/profile">
                    MON PROFIL
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-10 flex justify-center">
                <Button 
                  asChild
                  className="bg-noir hover:bg-gris-fonce text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
                >
                  <Link href="/signup?vendeur=true">
                    DEVENIR VENDEUR
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works for Vendeur */}
      <section className="py-12 sm:py-16 md:py-24 bg-blanc">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-3xl sm:text-4xl font-700 text-noir mb-4">
                  COMMENT CA MARCHE POUR VOUS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-12">
                  {/* Step 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-right order-2 md:order-1">
                      <h3 className="text-2xl font-semibold mb-4">1. Recevez des demandes</h3>
                      <p className="text-gris-moyen">
                        Les clients remplissent un formulaire pour demander un rendez-vous. 
                        Toutes les demandes sont visibles dans votre tableau de bord.
                      </p>
                    </div>
                    <div className="order-1 md:order-2 flex justify-center">
                      <div className="w-32 h-32 border-2 border-noir/20 rounded-lg flex items-center justify-center">
                        <Users className="h-16 w-16 text-noir/60" />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-semibold mb-4">2. Acceptez ou refusez</h3>
                      <p className="text-gris-moyen">
                        Pour chaque demande, vous pouvez accepter (pour prendre en charge le client) 
                        ou refuser (si vous n'etes pas disponible).
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-32 h-32 border-2 border-noir/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-16 w-16 text-noir/60" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-right order-2 md:order-1">
                      <h3 className="text-2xl font-semibold mb-4">3. Gérez le processus</h3>
                      <p className="text-gris-moyen">
                        Une fois la demande acceptée, vous pouvez mettre à jour le statut : 
                        articles récupérés, articles en vente, ou terminée.
                      </p>
                    </div>
                    <div className="order-1 md:order-2 flex justify-center">
                      <div className="w-32 h-32 border-2 border-noir/20 rounded-lg flex items-center justify-center">
                        <Euro className="h-16 w-16 text-noir/60" />
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-semibold mb-4">4. Gagnez de l'argent</h3>
                      <p className="text-gris-moyen">
                        Vous êtes rémunéré au juste prix du travail fourni. 
                        La plateforme vous met en relation avec des clients motivés.
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-32 h-32 border-2 border-noir/20 rounded-lg flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-noir/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-creme/50">
        <div className="container">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-noir mb-4">Pourquoi devenir vendeur ?</h2>
            <p className="text-lg text-gris-moyen mb-12 max-w-2xl mx-auto">
              Rejoignez notre réseau de vendeurs professionnels et bénéficiez de nombreux avantages
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2 border-noir/20">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                    <Euro className="h-6 w-6 text-noir" />
                  </div>
                  <CardTitle className="text-lg">Rémunération juste</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Vous êtes rémunéré au juste prix du travail fourni, sans intermédiaire
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-noir/20">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-noir" />
                  </div>
                  <CardTitle className="text-lg">Clients motivés</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    La plateforme vous met en relation avec des clients qui veulent vraiment vendre
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-noir/20">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-noir" />
                  </div>
                  <CardTitle className="text-lg">Flexibilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Gérez votre agenda comme vous le souhaitez, sans contrainte
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blanc">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-noir mb-6">
            Prêt à gagner de l'argent ?
          </h2>
          <p className="text-lg text-gris-moyen mb-8 max-w-2xl mx-auto">
            {profile 
              ? "Accédez à votre tableau de bord pour voir les demandes en attente"
              : "Commencez dès aujourd'hui à aider les clients à vendre leurs vêtements"
            }
          </p>
          {profile ? (
            <Button 
              asChild
              className="bg-noir hover:bg-gris-fonce text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
            >
              <Link href="/dashboard">
                VOIR MES DEMANDES <ChevronRight className="h-4 w-4 ml-2 inline" />
              </Link>
            </Button>
          ) : (
            <Button 
              asChild
              className="bg-noir hover:bg-gris-fonce text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
            >
              <Link href="/signup?vendeur=true">
                DEVENIR VENDEUR
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
