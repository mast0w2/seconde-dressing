"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Mail, Phone, User, ShoppingBag, Users, Leaf, ArrowLeft, ChevronLeft } from "lucide-react";
import Link from "next/link";

// Form schema for RDV request
const rdvFormSchema = z.object({
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  date_proposee: z.string().optional(),
  heure_proposee: z.string().optional(),
});

type RdvFormValues = z.infer<typeof rdvFormSchema>;

// Vendor info type
type VendorInfo = {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  benefits: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
};

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Role selection state: null = not selected, 'client' or 'vendeur' = selected
  const [selectedRole, setSelectedRole] = useState<'client' | 'vendeur' | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // RDV Form
  const rdvForm = useForm<RdvFormValues>({
    resolver: zodResolver(rdvFormSchema),
    defaultValues: {
      message: "",
      date_proposee: "",
      heure_proposee: "",
    },
  });

  const { handleSubmit: handleRdvSubmit, register, formState: rdvFormState } = rdvForm;
  const { errors: rdvErrors, isSubmitting: isRdvSubmitting } = rdvFormState;

  // Vendor info data
  const vendorInfo: VendorInfo = {
    title: "Espace Vendeur",
    description: "Gagnez de l'argent en aidant les clients à vendre leurs vêtements.",
    steps: [
      {
        title: "Recevez des demandes",
        description: "Les clients remplissent un formulaire pour demander un rendez-vous. Toutes les demandes sont visibles dans votre tableau de bord.",
        icon: <Users className="h-8 w-8 text-noir/60" />,
      },
      {
        title: "Acceptez ou refusez",
        description: "Pour chaque demande, vous pouvez accepter (pour prendre en charge le client) ou refuser (si vous n'êtes pas disponible).",
        icon: <Calendar className="h-8 w-8 text-noir/60" />,
      },
      {
        title: "Gérez le processus",
        description: "Une fois la demande acceptée, vous pouvez mettre à jour le statut : articles récupérés, articles en vente, ou terminée.",
        icon: <ShoppingBag className="h-8 w-8 text-noir/60" />,
      },
      {
        title: "Gagnez de l'argent",
        description: "Vous êtes rémunéré au juste prix du travail fourni. La plateforme vous met en relation avec des clients motivés.",
        icon: <Leaf className="h-8 w-8 text-noir/60" />,
      },
    ],
    benefits: [
      {
        title: "Rémunération juste",
        description: "Vous êtes rémunéré au juste prix du travail fourni, sans intermédiaire",
        icon: <ShoppingBag className="h-6 w-6 text-noir" />,
      },
      {
        title: "Clients motivés",
        description: "La plateforme vous met en relation avec des clients qui veulent vraiment vendre",
        icon: <Users className="h-6 w-6 text-noir" />,
      },
      {
        title: "Flexibilité",
        description: "Gérez votre agenda comme vous le souhaitez, sans contrainte",
        icon: <Calendar className="h-6 w-6 text-noir" />,
      },
    ],
  };

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

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (!isLoading && user && profile) {
      if (profile.role === "vendeur") {
        router.push("/vendeur");
      }
    }
  }, [user, profile, isLoading, router]);

  const handleRoleSelection = (role: 'client' | 'vendeur') => {
    setSelectedRole(role);
    // Store selected role for signup
    sessionStorage.setItem("selectedRole", role);
  };

  const handleRdvSubmitForm = (data: RdvFormValues) => {
    // Store form data in session for after auth
    sessionStorage.setItem("rdvFormData", JSON.stringify(data));
    // Show auth prompt
    setShowAuthPrompt(true);
  };

  const handleGoToSignup = (role: 'client' | 'vendeur') => {
    sessionStorage.setItem("selectedRole", role);
    router.push("/signup");
  };

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
      {/* Hero Section - Role Selection */}
      <section 
        className="flex-1 flex items-center justify-center py-20 md:py-32 bg-creme"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-creme/70 backdrop-blur-sm"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center w-full">
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

              {/* ====================================================================== */}
              {/* ROLE SELECTION - Always visible */}
              {/* ====================================================================== */}
              
              {/* Back button if role is selected */}
              {selectedRole && (
                <div className="absolute left-0 top-0 -mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center gap-2 h-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Retour
                  </Button>
                </div>
              )}

              {/* Role Selection Cards or Content based on selection */}
              <div className="max-w-4xl mx-auto">
                {selectedRole === null ? (
                  /* Role Selection Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className="border-noir text-noir hover:bg-noir hover:text-blanc w-full"
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
                            className="border-noir text-noir hover:bg-noir hover:text-blanc w-full"
                          >
                            Choisir Vendeur
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : selectedRole === 'client' ? (
                  /* Client RDV Form */
                  <div className="space-y-6">
                    <Card className="max-w-2xl mx-auto">
                      <CardHeader>
                        <CardTitle className="text-2xl">Demande de rendez-vous</CardTitle>
                        <CardDescription>
                          Remplissez ce formulaire pour être contacté par un vendeur
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <form onSubmit={handleRdvSubmit(handleRdvSubmitForm)} className="space-y-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="message">Message *</Label>
                              <Textarea
                                id="message"
                                placeholder="Décrivez vos vêtements, vos attentes, et toute information utile pour le vendeur..."
                                {...register("message")}
                                className={rdvErrors.message ? "border-destructive" : ""}
                                rows={6}
                              />
                              {rdvErrors.message && (
                                <p className="text-sm text-destructive">{rdvErrors.message.message}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="date_proposee">Date souhaitée (optionnel)</Label>
                                <Input
                                  id="date_proposee"
                                  type="date"
                                  {...register("date_proposee")}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="heure_proposee">Heure souhaitée (optionnel)</Label>
                                <Input
                                  id="heure_proposee"
                                  type="time"
                                  {...register("heure_proposee")}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            * Ces champs sont obligatoires
                          </div>

                          <Button type="submit" className="w-full" disabled={isRdvSubmitting}>
                            {isRdvSubmitting ? "Envoi..." : "Envoyer la demande"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Auth prompt after form submission */}
                    {showAuthPrompt && (
                      <Card className="max-w-2xl mx-auto border-2 border-noir/20">
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground mb-6">
                            Pour suivre votre demande, veuillez vous connecter ou créer un compte
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild className="w-full sm:w-auto">
                              <Link href="/login">
                                Se connecter
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                              <Link href="/signup">
                                Créer un compte
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Info Card */}
                    <Card className="max-w-2xl mx-auto">
                      <CardHeader>
                        <CardTitle>Que se passe-t-il ensuite ?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm">
                            Votre demande est envoyée à tous les vendeurs disponibles.
                          </p>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm">
                            Un vendeur vous contactera par email ou téléphone pour discuter de votre demande.
                          </p>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm">
                            Vous pourrez convenir ensemble d'un rendez-vous qui vous convient.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Vendor Explanation */
                  <div className="space-y-8">
                    <Card className="max-w-3xl mx-auto">
                      <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-700">
                          Espace Vendeur
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {vendorInfo.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <h3 className="text-xl font-semibold text-center mb-8">
                          COMMENT ÇA MARCHE POUR VOUS
                        </h3>
                        
                        <div className="space-y-12">
                          {vendorInfo.steps.map((step, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              <div className={`text-center md:text-${index % 2 === 0 ? 'right' : 'left'}`}>
                                <h4 className="text-xl font-semibold mb-4">{index + 1}. {step.title}</h4>
                                <p className="text-gris-moyen">{step.description}</p>
                              </div>
                              <div className={`flex justify-center order-${index % 2 === 0 ? '1' : '2'} md:order-${index % 2 === 0 ? '2' : '1'}`}>
                                <div className="w-32 h-32 border-2 border-noir/20 rounded-lg flex items-center justify-center">
                                  {step.icon}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Benefits Section */}
                    <Card className="max-w-3xl mx-auto">
                      <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold text-center mb-8">
                          Pourquoi devenir vendeur ?
                        </h3>
                        <p className="text-lg text-gris-moyen mb-8 max-w-2xl mx-auto text-center">
                          Rejoignez notre réseau de vendeurs professionnels et bénéficiez de nombreux avantages
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {vendorInfo.benefits.map((benefit, index) => (
                            <div key={index} className="text-center p-6 border border-noir/10 rounded-lg">
                              <div className="w-12 h-12 mx-auto mb-4 bg-noir/5 rounded-full flex items-center justify-center">
                                {benefit.icon}
                              </div>
                              <h4 className="font-semibold text-lg mb-2">{benefit.title}</h4>
                              <p className="text-sm text-gris-moyen">{benefit.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Signup CTA */}
                    <Card className="max-w-2xl mx-auto">
                      <CardContent className="pt-6 text-center">
                        <h3 className="text-xl font-semibold mb-4">
                          Prêt à gagner de l'argent ?
                        </h3>
                        <p className="text-lg text-gris-moyen mb-8">
                          Commencez dès aujourd'hui à aider les clients à vendre leurs vêtements
                        </p>
                        <Button 
                          onClick={() => handleGoToSignup('vendeur')}
                          className="w-full sm:w-auto"
                        >
                          S'inscrire comme vendeur
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
