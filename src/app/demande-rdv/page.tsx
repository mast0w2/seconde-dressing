"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Calendar, Clock, Mail, Phone, User, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  date_proposee: z.string().optional(),
  heure_proposee: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DemandeRdvPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      date_proposee: "",
      heure_proposee: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        // Store redirect path for after login
        sessionStorage.setItem("redirectAfterLogin", "/demande-rdv");
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!profile) {
        router.push("/signup");
        return;
      }

      // Only clients can make RDV requests
      if (profile.role !== "client") {
        toast({
          title: "Accès refusé",
          description: "Seuls les clients peuvent faire une demande de rendez-vous.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setProfile(profile);
      setIsLoading(false);
    };

    checkUser();
  }, [supabase, router, toast]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (!user || !profile) {
        throw new Error("User not found");
      }

      // Create the demande
      const demandeData = {
        client_id: user.id,
        client_nom: profile.nom,
        client_prenom: profile.prenom,
        client_email: profile.email,
        client_telephone: profile.telephone,
        type_demande: "rdv",
        message: data.message,
        statut: "en_attente",
        vendeur_id: null,
        date_proposee: data.date_proposee || null,
        heure_proposee: data.heure_proposee || null,
      };

      const { error } = await supabase
        .from("demandes")
        .insert([demandeData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de rendez-vous a été envoyée avec succès. Un vendeur va vous contacter rapidement.",
      });

      // Redirect to dashboard to see the demande
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Demande RDV error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Demande de rendez-vous</h1>
            <p className="text-muted-foreground">
              Remplissez ce formulaire pour être contacté par un vendeur
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Vos informations</CardTitle>
            <CardDescription>
              Ces informations seront envoyées aux vendeurs disponibles
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Display user info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Nom
                  </Label>
                  <p className="text-lg">{profile?.nom}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Prénom
                  </Label>
                  <p className="text-lg">{profile?.prenom}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <p className="text-lg">{profile?.email}</p>
              </div>

              {profile?.telephone && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Téléphone
                  </Label>
                  <p className="text-lg">{profile.telephone}</p>
                </div>
              )}

              {profile?.adresse_rue && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Adresse
                  </Label>
                  <p className="text-lg">
                    {profile.adresse_rue}, {profile.adresse_code_postal} {profile.adresse_ville}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Votre demande</h3>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez vos vêtements, vos attentes, et toute information utile pour le vendeur..."
                    {...register("message")}
                    className={errors.message ? "border-destructive" : ""}
                    rows={6}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
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

              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer la demande"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
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
                Vous pourrez convenir ensemble d&apos;un rendez-vous qui vous convient.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm">
                Vous pouvez suivre l&apos;état de votre demande dans votre tableau de bord.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import for icons
import { Euro } from "lucide-react";
