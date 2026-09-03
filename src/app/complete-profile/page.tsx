"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Profile } from "@/types/database";

const formSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      prenom: "",
    },
  });

  const { handleSubmit, register, formState, setValue } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        // Check if user already has a profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          // Profile exists, check if it's complete
          if (profileData.nom && profileData.prenom) {
            // Profile is complete, check if role is set
            if (profileData.role) {
              router.push("/");
              return;
            } else {
              // Role not set, redirect to role selection
              router.push("/role");
              return;
            }
          }
          // Profile exists but incomplete
          setProfile(profileData);
          setValue("nom", profileData.nom || "");
          setValue("prenom", profileData.prenom || "");
        } else {
          // No profile exists, check for temp data from OAuth
          const tempUser = sessionStorage.getItem("tempUser");
          const tempData = tempUser ? JSON.parse(tempUser) : null;
          
          if (tempData?.nom) {
            setValue("nom", tempData.nom);
          }
          if (tempData?.prenom) {
            setValue("prenom", tempData.prenom);
          }
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [supabase, router, toast, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (!user) {
        throw new Error("User not found");
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const profileData: any = {
        id: user.id,
        email: user.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: null,
        photo_url: null,
        bio: null,
        specialisation: null,
        tarif_horaire: null,
        annees_experience: null,
        role: null,
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", user.id);

        if (error) {
          throw error;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (error) {
          throw error;
        }
      }

      // Clear temp data
      sessionStorage.removeItem("tempUser");

      toast({
        title: "Informations personnelles enregistrées",
        description: "Vos informations ont été enregistrées avec succès.",
      });

      // Check if role is set
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (updatedProfile?.role) {
        router.push("/");
      } else {
        router.push("/role");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Compléter mon profil</CardTitle>
          <CardDescription>
            Veuillez remplir vos informations personnelles pour continuer
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Jean"
                  {...register("prenom")}
                  className={errors.prenom ? "border-destructive" : ""}
                />
                {errors.prenom && (
                  <p className="text-sm text-destructive">{errors.prenom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Dupont"
                  {...register("nom")}
                  className={errors.nom ? "border-destructive" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-4">
              * Ces informations sont obligatoires pour créer votre compte.
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Continuer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
