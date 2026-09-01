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
        className="relative py-16 sm:py-20 md:py-32 bg-creme"
        style={{
          backgroundImage: "url('/textile.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-creme/70 backdrop-blur-sm"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-noir rounded-full flex items-center justify-center bg-blanc/80">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-noir" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-noir">
              Économie circulaire
            </h1>
            <p className="text-lg sm:text-xl text-gris-moyen mb-6 sm:mb-8 max-w-3xl mx-auto">
              L'industrie textile est l'une des plus polluantes au monde. 
              Découvrez comment vous pouvez contribuer à réduire cet impact.
            </p>
          </div>
        </div>
      </section>

      {/* Industry Facts Section */}
      <section className="py-12 sm:py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card className="mb-10 sm:mb-12">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                  L'impact de l'industrie textile
                </CardTitle>
                <CardDescription className="text-center text-base sm:text-lg">
                  Quelques chiffres qui montrent l'urgence d'agir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Fact 1 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">10%</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">des émissions mondiales de CO2</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      L'industrie textile est responsable de 10% des émissions mondiales de CO2, 
                      soit plus que les vols internationaux et le transport maritime réunis.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 2 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">20%</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">des eaux usées industrielles</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      La production textile représente 20% des eaux usées industrielles dans le monde. 
                      La teinture des vêtements est particulièrement polluante.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 3 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">300M</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">de tonnes de CO2 par an</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      L'industrie de la mode émet environ 300 millions de tonnes de CO2 chaque année, 
                      soit l'équivalent des émissions annuelles de la France.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 4 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">70%</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">des vêtements finissent en décharge</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      70% des vêtements produits finissent en décharge ou sont incinérés. 
                      Moins de 1% des vêtements sont recyclés en nouveaux vêtements.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <Recycle className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 5 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">2.7K</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">litres d'eau par t-shirt</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      Il faut environ 2 700 litres d'eau pour produire un seul t-shirt en coton, 
                      soit assez pour qu'une personne boive pendant 2,5 ans.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <Trees className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>

                  {/* Fact 6 */}
                  <div className="text-center border border-noir/20 p-6 sm:p-8 rounded-lg">
                    <div className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 text-noir">50%</div>
                    <p className="font-semibold mb-2 text-sm sm:text-base">de microplastiques dans les océans</p>
                    <p className="text-xs sm:text-sm text-gris-moyen">
                      Le lavage des vêtements synthétiques libère des microplastiques qui représentent 
                      50% de la pollution microplastique des océans.
                    </p>
                    <div className="mt-3 sm:mt-4">
                      <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-noir mx-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Circular Economy Section */}
      <section className="py-12 sm:py-16 bg-gris-tres-clair">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                  La puissance de l'économie circulaire
                </CardTitle>
                <CardDescription className="text-center text-base sm:text-lg">
                  Comment chacun peut agir concrètement pour réduire son empreinte environnementale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 sm:space-y-10">
                  <div className="max-w-4xl mx-auto">
                    <p className="text-base sm:text-lg text-gris-moyen leading-relaxed mb-8">
                      L'économie circulaire repose sur un principe simple mais révolutionnaire : 
                      <strong>utiliser chaque produit jusqu'au bout de son cycle de vie</strong>.
                    </p>
                    <p className="text-base sm:text-lg text-gris-moyen leading-relaxed mb-8">
                      L'enjeu n'est pas de se contenter de vêtements à faible impact environnemental, 
                      mais de <strong>maximiser l'utilisation de chaque pièce</strong> déjà produite. 
                      Un vêtement porté jusqu'à usure complète, quel que soit son impact initial, 
                      voit son empreinte environnementale globale considérablement réduite.
                    </p>
                    
                    <div className="bg-creme p-6 sm:p-8 rounded-lg border border-noir/10">
                      <p className="text-base sm:text-lg text-gris-moyen text-center mb-6">
                        Si les vêtements étaient utilisés jusqu'à la fin de leur durée de vie 
                        au lieu d'être jetés après seulement un quart de celle-ci, 
                        <strong>l'impact environnemental de l'industrie textile pourrait être divisé par 4</strong>.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
                      Comment agir concrètement ?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <Recycle className="h-5 w-5" />
                            Aller au bout du cycle
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm sm:text-base text-gris-moyen">
                            L'économie circulaire permet de maximiser l'utilisation de chaque vêtement, 
                            évitant ainsi le gaspillage prématuré.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Réduction des déchets
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm sm:text-base text-gris-moyen">
                            Moins de vêtements jetés = moins de déchets textiles. Chaque année, des millions 
                            de tonnes de vêtements pourraient être sauvés.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-noir/20">
                        <CardHeader>
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <Leaf className="h-5 w-5" />
                            Optimisation des ressources
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm sm:text-base text-gris-moyen">
                            En utilisant pleinement ce qui existe déjà, nous réduisons le besoin de produire 
                            de nouveaux vêtements et l'impact qui va avec.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
                      Grâce à vous et Seconde
                    </h3>
                    <p className="text-base sm:text-lg text-gris-moyen leading-relaxed text-center">
                      En utilisant Seconde, vous facilitez la revente de vos vêtements pour qu'ils trouvent une nouvelle vie 
                      plutôt que de finir en décharge. C'est notre contribution concrète à l'économie circulaire 
                      et à la réduction de l'impact environnemental de la mode.
                    </p>
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
