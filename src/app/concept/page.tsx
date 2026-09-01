"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Leaf, Home, ShoppingBag, Users, Euro, Recycle } from "lucide-react";

export default function ConceptPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-beige to-creme py-16 sm:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-noir rounded-full flex items-center justify-center">
                <Recycle className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-noir">
              Notre Concept
            </h1>
            <p className="text-lg sm:text-xl text-gris-moyen mb-6 sm:mb-8 max-w-3xl mx-auto">
              Chez Seconde, nous croyons en une mode plus durable et accessible. 
              Découvrez comment on vous aide à vider votre dressing.
            </p>
          </div>
        </div>
      </section>

      {/* Service Levels Section */}
      <section className="py-12 sm:py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="mb-10 sm:mb-12">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                  Un service unique pour vendre vos vêtements
                </CardTitle>
                <CardDescription className="text-center text-base sm:text-lg">
                  Confiez vos vêtements de valeur à nos Dressing Angels pour une vente optimisée.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 sm:gap-8 mt-6 sm:mt-8">
                  {/* Single Service */}
                  <div className="border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-noir/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-noir" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-noir">Service complet de vente</h3>
                    </div>
                    <p className="text-sm sm:text-base text-gris-moyen mb-4 sm:mb-6">
                      Vous confiez vos vêtements valant plus de 20€ à une Dressing Angel. Elle s'occupe de tout : 
                      photographie, mise en ligne et vente. Vous recevez votre paiement dans les 60 jours au plus tard.
                    </p>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-primary">✓</span>
                        <span className="text-xs sm:text-sm text-gris-moyen">Vos vêtements doivent valoir plus de 20€</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-primary">✓</span>
                        <span className="text-xs sm:text-sm text-gris-moyen">La Dressing Angel gère tout le processus de vente</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-primary">✓</span>
                        <span className="text-xs sm:text-sm text-gris-moyen">Paiement sous 60 jours maximum</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-primary">✓</span>
                        <span className="text-xs sm:text-sm text-gris-moyen">40% de commission sur chaque vente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-12 sm:py-16 bg-gris-tres-clair">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                  Un business model transparent et équitable
                </CardTitle>
                <CardDescription className="text-center text-base sm:text-lg">
                  Nous croyons que la transparence est la clé de la confiance. 
                  Voici comment la valeur est répartie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-10 sm:space-y-12">
                  {/* Value Distribution */}
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">Répartition des revenus</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3 sm:mb-4">
                          <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                              strokeDasharray="40, 100"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl sm:text-2xl font-bold">40%</span>
                          </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base text-noir">Client</p>
                        <p className="text-xs sm:text-sm text-gris-moyen max-w-xs">
                          Vous récupérez 40% du montant de la vente sans faire d'effort.
                        </p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3 sm:mb-4">
                          <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                              strokeDasharray="40, 100"
                              strokeDashoffset="-40"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl sm:text-2xl font-bold">40%</span>
                          </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base text-noir">Dressing Angel</p>
                        <p className="text-xs sm:text-sm text-gris-moyen max-w-xs">
                          La vendeuse professionnelle reçoit 40% pour son expertise et son travail.
                        </p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3 sm:mb-4">
                          <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                              strokeDasharray="20, 100"
                              strokeDashoffset="-80"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl sm:text-2xl font-bold">20%</span>
                          </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base text-noir">Plateforme</p>
                        <p className="text-xs sm:text-sm text-gris-moyen max-w-xs">
                          20% pour la plateforme afin de rémunérer les développeurs et gérer les litiges.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Why This Model */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">Pourquoi ce modèle ?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 sm:gap-8">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Euro className="h-5 w-5" />
                            Rémunération équitable
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Chaque acteur reçoit une part juste pour son contribution. Les clients sont rémunérés 
                            pour leurs vêtements, les Dressing Angels pour leur expertise, et la plateforme pour 
                            son infrastructure et son support.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Soutien à l'économie locale
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            En utilisant nos services, vous soutenez directement des professionnels locaux (les Dressing Angels) 
                            ainsi que toute une équipe qui travaille pour rendre cette plateforme possible : développeurs, 
                            modérateurs, service client, etc.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Recycle className="h-5 w-5" />
                            Durabilité
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Ce modèle permet de donner une seconde vie à vos vêtements, réduisant ainsi l'impact 
                            environnemental de l'industrie textile. C'est un cercle vertueux où tout le monde y gagne.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Leaf className="h-5 w-5" />
                            Transparence
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Nous sommes transparents sur notre modèle économique car nous croyons que c'est la clé 
                            pour établir une relation de confiance avec nos clients. Vous savez exactement où va chaque euro.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Concrete Example */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 text-center">Exemple concret</h3>
                    <div className="space-y-6">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Veste en cuir vendue 200€</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-noir/10">
                              <span className="text-gris-moyen">Client (propriétaire de la veste)</span>
                              <span className="font-semibold">80€</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-noir/10">
                              <span className="text-gris-moyen">Dressing Angel (vendeuse professionnelle)</span>
                              <span className="font-semibold">80€</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-noir/10">
                              <span className="text-gris-moyen">Plateforme (frais de service)</span>
                              <span className="font-semibold">40€</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold">
                              <span>Total</span>
                              <span>200€</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <p className="text-center text-gris-moyen mt-6">
                      Cet exemple montre comment chaque vente crée de la valeur pour tous les acteurs 
                      de notre écosystème.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Circularity Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Favoriser la circularité
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  En utilisant Seconde, vous donnez une seconde vie à vos vêtements et participez 
                  à une économie circulaire.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-48 h-48 border-2 border-noir/20 rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">2,5</div>
                            <div className="text-sm text-gris-moyen">tonnes de CO2</div>
                            <div className="text-xs text-gris-moyen mt-1">économisées par tonne de vêtements recyclés</div>
                          </div>
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-noir/10 rounded-full flex items-center justify-center">
                          <Leaf className="h-8 w-8 text-noir" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-noir" />
                      </div>
                      <h4 className="font-semibold mb-2">Vendez vos vêtements</h4>
                      <p className="text-sm text-gris-moyen">
                        Au lieu de les jeter, donnez-leur une seconde vie et générez des revenus.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Recycle className="h-8 w-8 text-noir" />
                      </div>
                      <h4 className="font-semibold mb-2">Réduisez votre empreinte</h4>
                      <p className="text-sm text-gris-moyen">
                        Chaque vêtement vendu, c'est moins de déchets et moins de production neuve.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-noir" />
                      </div>
                      <h4 className="font-semibold mb-2">Créez de la valeur</h4>
                      <p className="text-sm text-gris-moyen">
                        Vous soutenez une économie locale et circulaire qui profite à tous.
                      </p>
                    </div>
                  </div>

                  <p className="text-center text-gris-moyen mt-8">
                    Ensemble, nous pouvons changer la façon dont la mode fonctionne. 
                    Chaque petit geste compte pour créer un impact significatif.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-beige to-creme">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-noir">
              Prêt à donner une seconde vie à vos vêtements ?
            </h2>
            <p className="text-xl text-gris-moyen mb-8">
              Rejoignez notre communauté et commencez à vendre ou acheter des vêtements de qualité 
              tout en participant à une mode plus durable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-noir text-blanc hover:bg-gris-fonce">
                <Link href="/signup">S'inscrire gratuitement</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-noir text-noir hover:bg-noir hover:text-blanc">
                <Link href="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
