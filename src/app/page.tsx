"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveEstimationForm } from "@/components/Form/ProgressiveEstimationForm";
import { Mail, Phone, Check, Calendar, Leaf, Target, Euro, ChevronDown, TrendingUp, Heart, Sparkles, Users } from "lucide-react";

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
          backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
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
              <p className="text-xl md:text-2xl text-gris-moyen mb-16 max-w-3xl mx-auto">
                On vous aide à vendre vos vêtements, donnez-leur une seconde vie !
              </p>
              
              {/* Avantages avec icônes - Style Cezanne */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 justify-items-center">
                {/* Gain de temps */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border border-noir rounded-full flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-noir" />
                  </div>
                  <span className="text-base md:text-lg font-500 text-noir tracking-wide text-center">
                    GAIN DE TEMPS
                  </span>
                </div>
                
                {/* Gain d'argent */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border border-noir rounded-full flex items-center justify-center">
                    <Euro className="h-8 w-8 text-noir" />
                  </div>
                  <span className="text-base md:text-lg font-500 text-noir tracking-wide text-center">
                    GAIN D'ARGENT
                  </span>
                </div>
                
                {/* Donnez-leur une seconde vie */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border border-noir rounded-full flex items-center justify-center">
                    <Leaf className="h-8 w-8 text-noir" />
                  </div>
                  <span className="text-base md:text-lg font-500 text-noir tracking-wide text-center">
                    DONNEZ-LEUR UNE SECONDE VIE
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => scrollToSection(formRef)}
                className="mt-12 bg-noir hover:bg-gris-fonce text-blanc px-12 py-4 rounded-none text-lg font-500 transition-all duration-300 tracking-widest"
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
      <section className="py-16 md:py-24 bg-blanc scroll-section">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Main Concept Card */}
            <Card className="mb-16 shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-4xl md:text-5xl font-700 text-noir mb-4">
                  NOTRE CONCEPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto">
                  <p className="mb-12 text-lg text-gris-moyen leading-relaxed text-center">
                    Confiez-nous vos vêtements, on s'occupe du reste !
                  </p>

                  <h3 className="text-2xl md:text-3xl font-600 mb-12 text-noir">
                    POURQUOI CHOISIR SECONDE ?
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Benefit 1 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">GAIN DE TEMPS</h4>
                        <p className="text-sm text-gris-moyen">
                          Plus besoin de gérer les annonces, les rendez-vous ou
                          les négociations
                        </p>
                      </div>
                    </div>

                    {/* Benefit 2 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Euro className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">40% DE COMMISSION</h4>
                        <p className="text-sm text-gris-moyen">
                          Vous récupérez 40% du prix de vente de vos articles
                        </p>
                      </div>
                    </div>

                    {/* Benefit 3 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">FLEXIBILITÉ</h4>
                        <p className="text-sm text-gris-moyen">
                          Choisissez le moment qui vous convient pour les
                          rendez-vous
                        </p>
                      </div>
                    </div>

                    {/* Benefit 4 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Check className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">SERVICE CLÉ EN MAIN</h4>
                        <p className="text-sm text-gris-moyen">
                          Nous nous occupons de tout : récupération, photographie,
                          mise en ligne et vente
                        </p>
                      </div>
                    </div>

                    {/* Benefit 5 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">SÉCURITÉ</h4>
                        <p className="text-sm text-gris-moyen">
                          Transactions sécurisées et suivi transparent de vos
                          ventes
                        </p>
                      </div>
                    </div>

                    {/* Benefit 6 */}
                    <div className="flex items-start gap-6 p-6 border-t border-noir/10">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <Heart className="h-8 w-8 text-noir" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-3 text-noir">DURABILITÉ</h4>
                        <p className="text-sm text-gris-moyen">
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
        className="py-16 md:py-24 bg-creme scroll-section"
      >
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="shadow-none border-0">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-4xl md:text-5xl font-700 text-noir mb-8">
                  COMMENT ÇA FONCTIONNE ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-700">
                      1
                    </div>
                    <div>
                      <h4 className="font-600 mb-3 text-noir">ESTIMATION EN LIGNE</h4>
                      <p className="text-gris-moyen">
                        Remplissez notre formulaire pour obtenir une estimation personnalisée
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-700">
                      2
                    </div>
                    <div>
                      <h4 className="font-600 mb-3 text-noir">CONTACT RAPIDE</h4>
                      <p className="text-gris-moyen">
                        Nous vous contactons sous 24h pour organiser un rendez-vous
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-700">
                      3
                    </div>
                    <div>
                      <h4 className="font-600 mb-3 text-noir">RÉCUPÉRATION À DOMICILE</h4>
                      <p className="text-gris-moyen">
                        Nous venons récupérer vos vêtements directement chez vous
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-700">
                      4
                    </div>
                    <div>
                      <h4 className="font-600 mb-3 text-noir">MISE EN VENTE</h4>
                      <p className="text-gris-moyen">
                        Vos vêtements sont photographiés, décrits et mis en
                        ligne sur nos plateformes partenaires
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-noir text-blanc rounded-full flex items-center justify-center font-700">
                      5
                    </div>
                    <div>
                      <h4 className="font-600 mb-3 text-noir">PAIEMENT</h4>
                      <p className="text-gris-moyen">
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
        className="py-16 md:py-24 bg-blanc scroll-section"
      >
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-700 mb-6 text-noir">
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
