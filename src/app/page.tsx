"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Leaf, ChevronDown, Users, ShoppingBag, Sparkles } from "lucide-react";

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profile);
      }
      setIsLoading(false);
    };

    checkUser();
  }, [supabase]);

  const handleRoleSelection = (role: "client" | "vendeur") => {
    // Store selected role in session for signup
    sessionStorage.setItem("selectedRole", role);
    router.push("/signup");
  };

  // If user is already logged in, redirect based on role
  useEffect(() => {
    if (!isLoading && user && profile) {
      if (profile.role === "vendeur") {
        router.push("/vendeur");
      }
      // Clients stay on homepage
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  // If user is logged in as vendeur, they shouldn't see this page
  if (user && profile?.role === "vendeur") {
    return null;
  }

  // Render
  return (
    <div className="flex flex-col min-h-screen bg-blanc text-noir">
      {/* Hero Section */}
      <section 
        className="relative py-20 md:py-32 scroll-section bg-creme"
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
            <div className="mb-12">
              <div className="w-16 h-16 mx-auto mb-6 border-2 border-noir rounded-full flex items-center justify-center">
                <Leaf className="h-8 w-8 text-noir" />
              </div>
              <h1 className="text-5xl md:text-7xl font-700 text-noir mb-8 leading-tight">
                SECONDE
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gris-moyen mb-12 max-w-3xl mx-auto">
                Donnez une seconde vie à vos vêtements
              </p>

              {/* Role Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Client Card */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-noir/20 hover:border-noir/40"
                  onClick={() => handleRoleSelection("client")}
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-noir" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      Vendre mes vêtements
                    </CardTitle>
                    <CardDescription>
                      Je veux vendre mes vêtements et avoir de l'aide pour les écouler
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        className="border-noir text-noir hover:bg-noir hover:text-blanc"
                      >
                        Choisir Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vendeur Card */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-noir/20 hover:border-noir/40"
                  onClick={() => handleRoleSelection("vendeur")}
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-noir" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      Aider à vendre
                    </CardTitle>
                    <CardDescription>
                      Je suis professionnel et aide les clients à vendre leurs vêtements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        className="border-noir text-noir hover:bg-noir hover:text-blanc"
                      >
                        Choisir Vendeur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll down indicator */}
        {!user && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="animate-bounce">
              <ChevronDown className="h-6 w-6 text-noir" />
            </div>
          </div>
        )}
      </section>

      {/* Concept Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-blanc scroll-section">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-700 text-noir mb-4">
                  NOTRE CONCEPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg mx-auto text-gris-fonce">
                  <p className="text-center text-lg text-gris-moyen mb-8">
                    Seconde est une plateforme qui vous permet de vendre vos vêtements 
                    d'occasion avec l'aide de professionnels.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6 border border-noir/10 rounded-lg">
                      <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-noir" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Économie Circulaire</h3>
                      <p className="text-sm text-gris-moyen">
                        Donnez une seconde vie à vos vêtements et participez à l'économie circulaire
                      </p>
                    </div>
                    
                    <div className="text-center p-6 border border-noir/10 rounded-lg">
                      <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                        <Euro className="h-6 w-6 text-noir" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Gagnez de l'argent</h3>
                      <p className="text-sm text-gris-moyen">
                        Vendez vos vêtements et gagnez de l'argent rapidement
                      </p>
                    </div>
                    
                    <div className="text-center p-6 border border-noir/10 rounded-lg">
                      <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-noir" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Accompagnement</h3>
                      <p className="text-sm text-gris-moyen">
                        Bénéficiez de l'aide de vendeurs professionnels pour maximiser vos ventes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-creme/50">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-noir mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-gris-moyen mb-8 max-w-2xl mx-auto">
              Rejoignez Seconde aujourd'hui et donnez une seconde vie à vos vêtements
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => handleRoleSelection("client")}
                className="bg-noir hover:bg-gris-fonce text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
              >
                VENDRE MES VÊTEMENTS
              </Button>
              <Button 
                onClick={() => handleRoleSelection("vendeur")}
                variant="outline"
                className="border-noir text-noir hover:bg-noir hover:text-blanc px-8 py-3 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
              >
                DEVENIR VENDEUR
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Import Lucide icons
import { Euro } from "lucide-react";
