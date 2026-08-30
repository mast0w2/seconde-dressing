"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressiveEstimationForm } from "@/components/Form/ProgressiveEstimationForm";
import { Mail, Phone, Check, Users, Calendar, Euro, Sparkles, Leaf, TrendingUp, Heart } from "lucide-react";

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  // Scroll to form
  const scrollToForm = () => {
    setShowForm(true);
    const formElement = document.getElementById("estimation-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Render
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Brand Guidelines */}
      <section className="relative bg-gradient-to-br from-vert-tres-clair to-vert-pale py-20 md:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-vert-emeraude rounded-2xl mb-6">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-600 text-noir-profond mb-6">
                Seconde Dressing
              </h1>
              <p className="text-xl md:text-2xl text-gris-fonce mb-8 max-w-3xl mx-auto">
                Nous rachetons et revendons vos vêtements de marque pour vous
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={scrollToForm}
                  className="bg-vert-emeraude hover:bg-vert-emeraude-clair text-white px-8 py-3 rounded-lg text-lg font-500 transition-all duration-200"
                >
                  Commencer l'estimation
                </Button>
                <Button 
                  variant="outline"
                  className="border-vert-emeraude text-vert-emeraude hover:bg-vert-tres-clair px-8 py-3 rounded-lg text-lg font-500 transition-all duration-200"
                >
                  En savoir plus
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Concept Presentation Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Main Concept Card */}
            <Card className="mb-12 md:mb-16 shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl font-600 text-center text-noir-profond">
                  Notre Concept
                </CardTitle>
                <CardDescription className="text-center text-gris-fonce text-lg">
                  Une solution unique pour vendre vos vêtements de qualité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <p className="mb-6 text-lg text-noir-profond">
                    <strong className="font-600">Seconde Dressing</strong> est une plateforme
                    innovante qui vous permet de vendre vos vêtements de marque sans vous en occuper.
                    Notre mission est de simplifier le processus de revente tout en
                    garantissant une expérience de qualité.
                  </p>

                  <h3 className="text-2xl md:text-3xl font-500 mb-8 text-noir-profond">
                    Pourquoi choisir Seconde Dressing ?
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {/* Benefit 1 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Gain de temps
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          Plus besoin de gérer les annonces, les rendez-vous ou
                          les négociations
                        </p>
                      </div>
                    </div>

                    {/* Benefit 2 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <Euro className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          40% de commission
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          Vous récupérez 40% du prix de vente de vos articles
                        </p>
                      </div>
                    </div>

                    {/* Benefit 3 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Flexibilité
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          Choisissez le moment qui vous convient pour les
                          rendez-vous
                        </p>
                      </div>
                    </div>

                    {/* Benefit 4 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <Check className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Service clé en main
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          Nous nous occupons de tout : récupération, photographie,
                          mise en ligne et vente
                        </p>
                      </div>
                    </div>

                    {/* Benefit 5 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Sécurité
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          Transactions sécurisées et suivi transparent de vos
                          ventes
                        </p>
                      </div>
                    </div>

                    {/* Benefit 6 */}
                    <div className="flex items-start gap-4 p-4 md:p-6 bg-vert-tres-clair rounded-xl border border-vert-pale">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-xl flex items-center justify-center">
                        <Heart className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Durabilité
                        </h4>
                        <p className="text-sm text-gris-fonce">
                          En donnant une seconde vie à vos vêtements, vous
                          contribuez à une mode plus durable et responsable
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-500 mb-8 text-noir-profond">
                    Comment ça fonctionne ?
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-vert-emeraude text-white rounded-full flex items-center justify-center font-600">
                        1
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">
                          Estimation en ligne
                        </h4>
                        <p className="text-gris-fonce">
                          Remplissez notre formulaire pour obtenir une estimation personnalisée
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-vert-emeraude text-white rounded-full flex items-center justify-center font-600">
                        2
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">Contact rapide</h4>
                        <p className="text-gris-fonce">
                          Nous vous contactons sous 24h pour organiser un rendez-vous
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-vert-emeraude text-white rounded-full flex items-center justify-center font-600">
                        3
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">Récupération à domicile</h4>
                        <p className="text-gris-fonce">
                          Nous venons récupérer vos vêtements directement chez vous
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-vert-emeraude text-white rounded-full flex items-center justify-center font-600">
                        4
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">Mise en vente</h4>
                        <p className="text-gris-fonce">
                          Vos vêtements sont photographiés, décrits et mis en
                          ligne sur nos plateformes partenaires
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-vert-emeraude text-white rounded-full flex items-center justify-center font-600">
                        5
                      </div>
                      <div>
                        <h4 className="font-600 mb-2 text-noir-profond">Paiement</h4>
                        <p className="text-gris-fonce">
                          Recevez votre paiement (40% du prix de vente) directement sur votre compte
                          bancaire après la vente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-noir-profond">
                    Transparence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gris-fonce text-center">
                    Nous croyons en la transparence totale. Vous savez toujours
                    où en sont vos vêtements et combien vous allez gagner.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-noir-profond">
                    Professionnalisme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gris-fonce text-center">
                    Nos vendeuses sont sélectionnées pour leur expertise et leur
                    sens du service client.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-noir-profond">
                    Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gris-fonce text-center">
                    Votre satisfaction est notre priorité. Nous nous engageons à
                    offrir un service de qualité.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Progressive Form Section */}
      <section 
        id="estimation-form"
        className="py-16 md:py-24 bg-gradient-to-br from-vert-tres-clair to-vert-pale"
      >
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-600 mb-4 text-noir-profond">
                Obtenez une estimation gratuite
              </h2>
              <p className="text-xl text-gris-fonce">
                Remplissez notre formulaire et découvrez combien vous pourriez gagner
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Vous toucherez 40% du prix de vente estimé
              </p>
            </div>

            <ProgressiveEstimationForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-600 mb-6 text-noir-profond">
              Prêt à donner une seconde vie à vos vêtements ?
            </h2>
            <p className="text-xl text-gris-fonce mb-8">
              Contactez-nous dès maintenant et commencez votre expérience avec
              Seconde Dressing.
            </p>
            <Button 
              onClick={scrollToForm}
              className="bg-vert-emeraude hover:bg-vert-emeraude-clair text-white px-8 py-4 rounded-lg text-lg font-500 transition-all duration-200"
            >
              Commencer l'estimation
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-16 md:py-24 bg-vert-tres-clair">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-noir-profond">
                  Autres moyens de contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h3 className="font-600 mb-1 text-noir-profond">Email</h3>
                        <p className="text-muted-foreground">
                          contact@seconde-dressing.fr
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-vert-emeraude/10 rounded-full flex items-center justify-center">
                        <Phone className="h-6 w-6 text-vert-emeraude" />
                      </div>
                      <div>
                        <h3 className="font-600 mb-1 text-noir-profond">Téléphone</h3>
                        <p className="text-muted-foreground">+33 1 23 45 67 89</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-600 mb-2 text-noir-profond">Adresse</h3>
                      <p className="text-muted-foreground">
                        123 Rue de la Mode
                        <br />
                        75000 Paris, France
                      </p>
                    </div>

                    <div>
                      <h3 className="font-600 mb-2 text-noir-profond">Heures d'ouverture</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Lundi - Vendredi</span>
                          <span>9h00 - 18h00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Samedi</span>
                          <span>10h00 - 16h00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dimanche</span>
                          <span>Fermé</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
