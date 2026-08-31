"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Leaf, Factory, TrendingDown, Recycle, Globe, Droplets, Trees, Users } from "lucide-react";

export default function ImpactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-20 md:py-32 scroll-section bg-creme"
        style={{
          backgroundImage: "url('/textile.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-creme/70 backdrop-blur-sm"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-2 border-noir rounded-full flex items-center justify-center bg-blanc/80">
                <Globe className="h-8 w-8 text-noir" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-noir">
              Notre Impact Environnemental
            </h1>
            <p className="text-xl text-gris-moyen mb-8 max-w-3xl mx-auto">
              L'industrie textile est l'une des plus polluantes au monde. 
              Découvrez comment Seconde contribue à réduire cet impact.
            </p>
          </div>
        </div>
      </section>

      {/* Industry Facts Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  L'impact de l'industrie textile
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Quelques chiffres qui montrent l'urgence d'agir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Fact 1 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">10%</div>
                    <p className="font-semibold mb-2">des émissions mondiales de CO2</p>
                    <p className="text-sm text-gris-moyen">
                      L'industrie textile est responsable de 10% des émissions mondiales de CO2, 
                      soit plus que les vols internationaux et le transport maritime réunis.
                    </p>
                    <div className="mt-4">
                      <Factory className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 2 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">20%</div>
                    <p className="font-semibold mb-2">des eaux usées industrielles</p>
                    <p className="text-sm text-gris-moyen">
                      La production textile représente 20% des eaux usées industrielles dans le monde. 
                      La teinture des vêtements est particulièrement polluante.
                    </p>
                    <div className="mt-4">
                      <Droplets className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 3 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">300M</div>
                    <p className="font-semibold mb-2">de tonnes de CO2 par an</p>
                    <p className="text-sm text-gris-moyen">
                      L'industrie de la mode émet environ 300 millions de tonnes de CO2 chaque année, 
                      soit l'équivalent des émissions annuelles de la France.
                    </p>
                    <div className="mt-4">
                      <TrendingDown className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 4 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">70%</div>
                    <p className="font-semibold mb-2">des vêtements finissent en décharge</p>
                    <p className="text-sm text-gris-moyen">
                      70% des vêtements produits finissent en décharge ou sont incinérés. 
                      Moins de 1% des vêtements sont recyclés en nouveaux vêtements.
                    </p>
                    <div className="mt-4">
                      <Recycle className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 5 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">2.7K</div>
                    <p className="font-semibold mb-2">litres d'eau par t-shirt</p>
                    <p className="text-sm text-gris-moyen">
                      Il faut environ 2 700 litres d'eau pour produire un seul t-shirt en coton, 
                      soit assez pour qu'une personne boive pendant 2,5 ans.
                    </p>
                    <div className="mt-4">
                      <Trees className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 6 */}
                  <div className="text-center border border-noir/20 p-8 rounded-lg">
                    <div className="text-5xl font-bold mb-4 text-noir">50%</div>
                    <p className="font-semibold mb-2">de microplastiques dans les océans</p>
                    <p className="text-sm text-gris-moyen">
                      Le lavage des vêtements synthétiques libère des microplastiques qui représentent 
                      50% de la pollution microplastique des océans.
                    </p>
                    <div className="mt-4">
                      <Globe className="h-8 w-8 text-noir mx-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="py-16 bg-gris-tres-clair">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Comment Seconde réduit cet impact
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Chaque action compte. Voici comment notre plateforme contribue à un avenir plus durable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-12">
                  {/* Extension of Life */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 text-center">
                      Prolonger la durée de vie des vêtements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Recycle className="h-5 w-5" />
                            Réutilisation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            En donnant une seconde vie à vos vêtements, nous évitons qu'ils ne finissent 
                            en décharge. Chaque vêtement vendu, c'est un vêtement qui n'a pas besoin 
                            d'être produit.
                          </p>
                          <div className="mt-4 bg-noir/5 p-4 rounded">
                            <p className="text-sm">
                              <strong>Saviez-vous ?</strong> Doubler la durée de vie d'un vêtement réduit son impact 
                              environnemental de 44%.
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Réduction des déchets
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Chaque année, des millions de tonnes de vêtements sont jetées. En facilitant 
                            la revente, nous aidons à réduire ce gaspillage.
                          </p>
                          <div className="mt-4 bg-noir/5 p-4 rounded">
                            <p className="text-sm">
                              <strong>Impact :</strong> Chaque tonne de vêtements recyclés économise 2,5 tonnes 
                              de CO2.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Circular Economy */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 text-center">
                      Favoriser l'économie circulaire
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Leaf className="h-5 w-5" />
                            Réduction de la production
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Moins de vêtements finissent en décharge, donc moins de vêtements doivent 
                            être produits. Cela réduit la consommation de ressources naturelles 
                            (eau, terres agricoles, etc.).
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Réduction des émissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            En réduisant la production de vêtements neufs, nous diminuons les émissions 
                            de CO2 associées à leur fabrication et leur transport.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Awareness */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-6 text-center">
                      Sensibiliser et éduquer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Changement des mentalités
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            En rendant la revente facile et accessible, nous encourageons une consommation 
                            plus responsable. Les clients prennent conscience de la valeur de leurs vêtements.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Trees className="h-5 w-5" />
                            Promotion de la durabilité
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gris-moyen">
                            Nous mettons en avant les vêtements de qualité qui durent dans le temps, 
                            encourageant ainsi une mode plus durable.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Notre engagement
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Chez Seconde, nous nous engageons à faire de la durabilité une priorité.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Leaf className="h-8 w-8 text-noir" />
                    </div>
                    <h4 className="font-semibold mb-2">Transparence</h4>
                    <p className="text-sm text-gris-moyen">
                      Nous sommes transparents sur notre impact environnemental et nos pratiques.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Recycle className="h-8 w-8 text-noir" />
                    </div>
                    <h4 className="font-semibold mb-2">Innovation</h4>
                    <p className="text-sm text-gris-moyen">
                      Nous cherchons constamment des moyens d'améliorer notre impact positif.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-noir/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-8 w-8 text-noir" />
                    </div>
                    <h4 className="font-semibold mb-2">Collaboration</h4>
                    <p className="text-sm text-gris-moyen">
                      Nous travaillons avec des partenaires qui partagent nos valeurs de durabilité.
                    </p>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-gris-moyen mb-6">
                    Nous croyons que chaque petit geste compte. En choisissant Seconde, vous faites 
                    partie d'un mouvement plus large pour une mode plus responsable et plus durable.
                  </p>
                  <p className="text-gris-moyen">
                    Ensemble, nous pouvons faire la différence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-beige to-creme">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-noir">
              Rejoignez le mouvement
            </h2>
            <p className="text-xl text-gris-moyen mb-8">
              Chaque vêtement que vous vendez ou achetez sur Seconde contribue à réduire 
              l'impact environnemental de l'industrie textile. 
              Ensemble, nous pouvons faire la différence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-noir text-blanc hover:bg-gris-fonce">
                <Link href="/signup">S'inscrire maintenant</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-noir text-noir hover:bg-noir hover:text-blanc">
                <Link href="/concept">En savoir plus sur notre concept</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sources Section */}
      <section className="py-12 border-t border-noir/10">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-center">Sources et références</h3>
            <div className="text-sm text-gris-moyen space-y-4">
              <p>
                Les données présentées sur cette page proviennent de sources fiables telles que :
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Rapport de l'ONU sur l'industrie textile (2019)</li>
                <li>Étude de l'ADEME sur l'impact environnemental des vêtements</li>
                <li>Rapport Ellen MacArthur Foundation : "A New Textiles Economy"</li>
                <li>Données de l'Agence européenne pour l'environnement (AEE)</li>
                <li>Études de WRAP (Waste and Resources Action Programme)</li>
              </ul>
              <p>
                Nous nous engageons à maintenir nos informations à jour et basées sur des données 
                scientifiques vérifiées.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
