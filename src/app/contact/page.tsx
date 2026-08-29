// src/app/contact/page.tsx
// Contact page with form validation and submission

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Phone, MapPin } from 'lucide-react';

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

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate contact form
 */
function validateForm(data: ContactFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('Le nom est requis');
  }

  if (!data.email.trim()) {
    errors.push('L\'email est requis');
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push('L\'email n\'est pas valide');
  }

  if (!data.subject.trim()) {
    errors.push('Le sujet est requis');
  }

  if (!data.message.trim()) {
    errors.push('Le message est requis');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Submit contact form
 */
async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, ...result };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error('[Contact] Submission error:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}

// ============================================================================
// Component
// ============================================================================

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          title: 'Erreur',
          description: error,
          variant: 'destructive',
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
              title: 'Erreur',
              description: error,
              variant: 'destructive',
            });
          });
        } else {
          toast({
            title: 'Erreur',
            description: result.message || 'Impossible d\'envoyer votre message.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      toast({
        title: 'Succès',
        description: result.message || 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      });
    } catch (error) {
      console.error('[Contact] Error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer votre message. Veuillez réessayer.',
        variant: 'destructive',
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
              Contactez-nous
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Nous sommes là pour répondre à toutes vos questions
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Envoyez-nous un message</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
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
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Email and Phone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Informations de contact</CardTitle>
                  <CardDescription>
                    Plusieurs façons de nous contacter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      <p className="text-muted-foreground">
                        +33 1 23 45 67 89
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Adresse</h3>
                      <p className="text-muted-foreground">
                        123 Rue de la Mode
                        <br />
                        75000 Paris, France
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Heures d'ouverture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Lundi - Vendredi</span>
                      <span className="text-muted-foreground">9h00 - 18h00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Samedi</span>
                      <span className="text-muted-foreground">10h00 - 16h00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Dimanche</span>
                      <span className="text-muted-foreground">Fermé</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button variant="outline" asChild>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                        Facebook
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                        Instagram
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Questions Fréquentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comment créer un compte ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur "S'inscrire" dans le menu, remplissez le formulaire avec vos informations et validez votre adresse email.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Combien coûte le service ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Notre service est gratuit pour les clients. Les vendeuses paient une commission sur les ventes réalisées.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comment prendre un rendez-vous ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connectez-vous à votre compte, accédez à l'espace client et sélectionnez une vendeuse disponible selon vos préférences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comment suis-je payé ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Les paiements sont traités automatiquement après la vente de vos vêtements. Vous recevez votre part directement sur votre compte bancaire.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
