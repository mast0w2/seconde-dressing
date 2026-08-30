"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
              Découvrez Seconde
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              La plateforme innovante qui révolutionne la revente de vêtements
            </p>
          </div>
        </div>
      </section>

      {/* Concept Description */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Notre Concept
                </CardTitle>
                <CardDescription className="text-center">
                  Une solution unique pour vendre et acheter des vêtements de qualité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <p className="mb-6">
                    <strong>Seconde</strong> est une plateforme innovante qui met en relation des clients souhaitant vendre leurs vêtements avec des vendeuses professionnelles. Notre mission est de simplifier le processus de revente tout en garantissant une expérience de qualité pour toutes les parties prenantes.
                  </p>

                  <h3 className="text-2xl font-semibold mb-4">Pourquoi choisir Seconde ?</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Expertise professionnelle</strong> : Nos vendeuses sont formées pour maximiser la valeur de vos vêtements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Gain de temps</strong> : Plus besoin de gérer les annonces, les rendez-vous ou les négociations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Sécurité</strong> : Transactions sécurisées et suivi transparent de vos ventes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Flexibilité</strong> : Choisissez le moment qui vous convient pour les rendez-vous</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Réseau étendu</strong> : Accès à une communauté de vendeuses qualifiées</span>
                    </li>
                  </ul>

                  <h3 className="text-2xl font-semibold mb-4">Comment ça fonctionne ?</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Création de compte</h4>
                        <p>Inscrivez-vous gratuitement en tant que client ou vendeuse professionnelle</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Prise de rendez-vous</h4>
                        <p>Les clients prennent rendez-vous avec les vendeuses disponibles selon leurs préférences</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Évaluation et sélection</h4>
                        <p>La vendeuse évalue vos vêtements et sélectionne les pièces à mettre en vente</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Mise en vente</h4>
                        <p>Vos vêtements sont photographiés, décrits et mis en ligne sur nos plateformes partenaires</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Paiement et suivi</h4>
                        <p>Suivez vos ventes en temps réel et recevez vos paiements directement sur votre compte</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Transparence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nous croyons en la transparence totale. Vous savez toujours où en sont vos vêtements et combien vous allez gagner.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Professionnalisme</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nos vendeuses sont sélectionnées pour leur expertise et leur sens du service client.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Durabilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    En donnant une seconde vie à vos vêtements, vous contribuez à une mode plus durable et responsable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez notre communauté et commencez à vendre ou acheter des vêtements de qualité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/signup">S&apos;inscrire gratuitement</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
