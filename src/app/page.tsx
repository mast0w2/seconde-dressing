"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, Check, Users, Calendar, Euro, Sparkles } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================================================
// Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(data: ContactFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push("Le nom est requis");
  }

  if (!data.email.trim()) {
    errors.push("L'email est requis");
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push("L'email n'est pas valide");
  }

  if (!data.subject.trim()) {
    errors.push("Le sujet est requis");
  }

  if (!data.message.trim()) {
    errors.push("Le message est requis");
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// API Functions
// ============================================================================

async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, ...result };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error("[Contact] Submission error:", error);
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer.",
    };
  }
}

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast({
          title: "Erreur",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);

      if (!result.success) {
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error) => {
            toast({
              title: "Erreur",
              description: error,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Erreur",
            description:
              result.message || "Impossible d'envoyer votre message.",
            variant: "destructive",
          });
        }
        return;
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      toast({
        title: "Succès",
        description:
          result.message ||
          "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
      });
    } catch (error) {
      console.error("[Contact] Error:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible d'envoyer votre message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
              Seconde Dressing
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              La plateforme qui connecte les clients avec des vendeuses
              professionnelles pour donner une seconde vie à vos vêtements
            </p>
          </div>
        </div>
      </section>

      {/* Concept Presentation Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Main Concept Card */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Notre Concept
                </CardTitle>
                <CardDescription className="text-center">
                  Une solution unique pour vendre et acheter des vêtements de
                  qualité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <p className="mb-6 text-lg">
                    <strong>Seconde Dressing</strong> est une plateforme
                    innovante qui met en relation des clients souhaitant vendre
                    leurs vêtements avec des vendeuses professionnelles. Notre
                    mission est de simplifier le processus de revente tout en
                    garantissant une expérience de qualité pour toutes les
                    parties prenantes.
                  </p>

                  <h3 className="text-2xl font-semibold mb-6">
                    Pourquoi choisir Seconde Dressing ?
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Benefit 1 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Expertise professionnelle
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Nos vendeuses sont formées pour maximiser la valeur de
                          vos vêtements
                        </p>
                      </div>
                    </div>

                    {/* Benefit 2 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Réseau étendu</h4>
                        <p className="text-sm text-muted-foreground">
                          Accès à une communauté de vendeuses qualifiées
                        </p>
                      </div>
                    </div>

                    {/* Benefit 3 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Flexibilité</h4>
                        <p className="text-sm text-muted-foreground">
                          Choisissez le moment qui vous convient pour les
                          rendez-vous
                        </p>
                      </div>
                    </div>

                    {/* Benefit 4 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Euro className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Gain de temps</h4>
                        <p className="text-sm text-muted-foreground">
                          Plus besoin de gérer les annonces, les rendez-vous ou
                          les négociations
                        </p>
                      </div>
                    </div>

                    {/* Benefit 5 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Sécurité</h4>
                        <p className="text-sm text-muted-foreground">
                          Transactions sécurisées et suivi transparent de vos
                          ventes
                        </p>
                      </div>
                    </div>

                    {/* Benefit 6 */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Durabilité</h4>
                        <p className="text-sm text-muted-foreground">
                          En donnant une seconde vie à vos vêtements, vous
                          contribuez à une mode plus durable et responsable
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold mb-6">
                    Comment ça fonctionne ?
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">
                          Prise de contact
                        </h4>
                        <p>
                          Contactez-nous via le formulaire ci-dessous pour
                          exprimer votre intérêt
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Évaluation</h4>
                        <p>
                          Une vendeuse professionnelle évalue vos vêtements et
                          vous propose une offre
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Rendez-vous</h4>
                        <p>
                          Planifiez un rendez-vous pour la remise de vos
                          vêtements
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Mise en vente</h4>
                        <p>
                          Vos vêtements sont photographiés, décrits et mis en
                          ligne sur nos plateformes partenaires
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Paiement</h4>
                        <p>
                          Recevez votre paiement directement sur votre compte
                          bancaire après la vente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    Transparence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Nous croyons en la transparence totale. Vous savez toujours
                    où en sont vos vêtements et combien vous allez gagner.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    Professionnalisme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Nos vendeuses sont sélectionnées pour leur expertise et leur
                    sens du service client.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Votre satisfaction est notre priorité. Nous nous engageons à
                    offrir un service de qualité.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Intéressé ? Contactez-nous
                </CardTitle>
                <CardDescription className="text-center">
                  Remplissez le formulaire ci-dessous et nous vous contacterons
                  rapidement pour discuter de vos besoins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Votre nom complet"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="votre@email.com"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone (optionnel)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+33 1 23 45 67 89"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Sujet de votre message"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre demande ou posez votre question..."
                      rows={6}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Autres moyens de contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-muted-foreground">
                          contact@seconde-dressing.fr
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Téléphone</h3>
                        <p className="text-muted-foreground">+33 1 23 45 67 89</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Adresse</h3>
                      <p className="text-muted-foreground">
                        123 Rue de la Mode
                        <br />
                        75000 Paris, France
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Heures d'ouverture</h3>
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à donner une seconde vie à vos vêtements ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Contactez-nous dès maintenant et commencez votre expérience avec
              Seconde Dressing.
            </p>
            <Button asChild size="lg">
              <a href="#contact">Contactez-nous</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
