"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveEstimationForm } from "@/components/Form/ProgressiveEstimationForm";
import { Mail, Phone, Check, Calendar, Leaf, Target, Euro, ChevronDown, TrendingUp, Heart, Sparkles, Users, Recycle } from "lucide-react";

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Render
  return (
    <div className="flex flex-col min-h-screen bg-blanc text-noir">
      {/* Hero Section - Full page - Cezanne Style */}
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
              <h1 className="text-5xl md:text-7xl font-700 text-noir mb-8 leading-tight">
                Seconde
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gris-moyen mb-12 max-w-3xl mx-auto">
                On vous aide à vendre vos vêtements, donnez-leur une seconde vie !
              </p>
              
              {/* Avantages avec icônes - Style Cezanne */}
              <div className="w-full max-w-4xl mx-auto">
                {/* Ligne des icônes */}
                <div className="flex justify-center gap-2 sm:gap-4 md:gap-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border border-noir rounded-full flex items-center justify-center flex-shrink-0">
                    <Leaf className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-noir" />
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border border-noir rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-noir" />
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border border-noir rounded-full flex items-center justify-center flex-shrink-0">
                    <Euro className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-noir" />
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border border-noir rounded-full flex items-center justify-center flex-shrink-0">
                    <Recycle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-noir" />
                  </div>
                </div>
                
                {/* Ligne du texte */}
                <p className="text-center text-xs sm:text-sm md:text-base mt-3 sm:mt-4 tracking-wide font-500 text-noir">
                  Videz votre dressing sans effort en gagnant de l&apos;argent grâce à l&apos;économie circulaire
                </p>
              </div>
              <Button 
                onClick={() => scrollToSection(formRef)}
                className="mt-10 bg-noir hover:bg-gris-fonce text-blanc px-8 sm:px-12 py-3 sm:py-4 rounded-none text-sm sm:text-lg font-500 transition-all duration-300 tracking-widest"
              >
                DEMANDEZ UN RENDEZ-VOUS
              </Button>
            </div>
          </div>
        </div>
        {/* Scroll down indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <ChevronDown className="h-6 w-6 text-noir" />
          </div>
        </div>
      </section>

      {/* Concept Section - Full page - Cezanne Style */}
      <section className="py-12 sm:py-16 md:py-24 bg-blanc scroll-section">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Main Concept Card */}
            <Card className="mb-12 sm:mb-16 shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-700 text-noir mb-4">
                  NOTRE CONCEPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto">
                  <p className="mb-10 sm:mb-12 text-base sm:text-lg text-gris-moyen leading-relaxed text-center">
                    Confiez-nous vos vêtements, on s'occupe du reste !
                  </p>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-600 mb-10 sm:mb-12 text-noir">
                    POURQUOI CHOISIR SECONDE ?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Benefit 1 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">GAIN DE TEMPS</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          Plus besoin de gérer les annonces, les rendez-vous ou
                          les négociations
                        </p>
                      </div>
                    </div>

                    {/* Benefit 2 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <Euro className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">GAGNER DE L'ARGENT</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          Vos vêtements sont vendus au meilleur prix et vous récupérez une partie du prix de vente de vos articles
                        </p>
                      </div>
                    </div>

                    {/* Benefit 3 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">FLEXIBILITÉ</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          Choisissez le moment qui vous convient pour les
                          rendez-vous
                        </p>
                      </div>
                    </div>

                    {/* Benefit 4 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <Check className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">SERVICE CLÉ EN MAIN</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          Nous nous occupons de tout : récupération, photographie,
                          mise en ligne et vente
                        </p>
                      </div>
                    </div>

                    {/* Benefit 5 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">SÉCURITÉ</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          Transactions sécurisées et suivi transparent de vos
                          ventes
                        </p>
                      </div>
                    </div>

                    {/* Benefit 6 */}
                    <div className="flex items-start gap-4 p-4 sm:p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">DURABILITÉ</h4>
                        <p className="text-xs sm:text-sm text-gris-moyen">
                          En donnant une seconde vie à vos vêtements, vous
                          contribuez à une mode plus durable et responsable
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Scroll down indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <ChevronDown className="h-6 w-6 text-noir" />
          </div>
        </div>
      </section>

      {/* How It Works Section - Full page - Cezanne Style */}
      <section 
        ref={howItWorksRef}
        className="py-12 sm:py-16 md:py-24 bg-creme scroll-section"
      >
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-700 text-noir mb-6 sm:mb-8">
                  COMMENT ÇA FONCTIONNE ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-600 sm:font-700 text-sm sm:text-base">
                      1
                    </div>
                    <div>
                      <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">PRENEZ RENDEZ-VOUS</h4>
                      <p className="text-xs sm:text-sm text-gris-moyen">
                        Remplissez notre formulaire pour qu'on vous contacte
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-600 sm:font-700 text-sm sm:text-base">
                      2
                    </div>
                    <div>
                      <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">CONTACT RAPIDE</h4>
                      <p className="text-xs sm:text-sm text-gris-moyen">
                        Nous vous contactons dans les deux heures pour organiser un rendez-vous
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-600 sm:font-700 text-sm sm:text-base">
                      3
                    </div>
                    <div>
                      <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">RÉCUPÉRATION À DOMICILE</h4>
                      <p className="text-xs sm:text-sm text-gris-moyen">
                        Nous venons récupérer vos vêtements directement chez vous
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-600 sm:font-700 text-sm sm:text-base">
                      4
                    </div>
                    <div>
                      <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">MISE EN VENTE</h4>
                      <p className="text-xs sm:text-sm text-gris-moyen">
                        Vos vêtements sont photographiés, décrits et mis en
                        ligne sur nos plateformes partenaires
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-600 sm:font-700 text-sm sm:text-base">
                      5
                    </div>
                    <div>
                      <h4 className="font-600 mb-2 sm:mb-3 text-sm sm:text-base text-noir">PAIEMENT</h4>
                      <p className="text-xs sm:text-sm text-gris-moyen">
                        Recevez votre paiement directement sur votre compte bancaire après la vente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Scroll down indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <ChevronDown className="h-6 w-6 text-noir" />
          </div>
        </div>
      </section>

      {/* Progressive Form Section - Full page - Cezanne Style */}
      <section 
        ref={formRef}
        id="estimation-form"
        className="py-12 sm:py-16 md:py-24 bg-blanc scroll-section"
      >
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-700 mb-4 sm:mb-6 text-noir">
                DEMANDEZ UN RENDEZ-VOUS
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <ProgressiveEstimationForm />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}