"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Profile } from "@/types/database";
import { Mail, Phone, User, Home, MapPin, ArrowLeft, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const profileFormSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().optional(),
  bio: z.string().optional(),
  adresse_rue: z.string().optional(),
  adresse_ville: z.string().optional(),
  adresse_code_postal: z.string().optional(),
  adresse_pays: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      telephone: "",
      bio: "",
      adresse_rue: "",
      adresse_ville: "",
      adresse_code_postal: "",
      adresse_pays: "",
    },
  });

  const { handleSubmit, register, formState, setValue, reset } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);
          // Populate form with profile data
          reset({
            nom: profileData.nom || "",
            prenom: profileData.prenom || "",
            telephone: profileData.telephone || "",
            bio: profileData.bio || "",
            adresse_rue: profileData.adresse_rue || "",
            adresse_ville: profileData.adresse_ville || "",
            adresse_code_postal: profileData.adresse_code_postal || "",
            adresse_pays: profileData.adresse_pays || "",
          });
        } else {
          // Create a basic profile if it doesn't exist
          const { error: createError } = await supabase
            .from("profiles")
            .insert([{
              id: currentUser.id,
              email: currentUser.email,
              nom: null,
              prenom: null,
              role: null,
            }]);
          
          if (createError) {
            console.error("Error creating profile:", createError);
          }
          
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
          
          setProfile(newProfile || null);
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

    fetchUserData();
  }, [supabase, router, toast, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      if (!user) {
        throw new Error("User not found");
      }

      // Prepare profile data - include address fields
      const profileData: any = {
        id: user.id,
        email: user.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone || null,
        bio: data.bio || null,
        adresse_rue: data.adresse_rue || null,
        adresse_ville: data.adresse_ville || null,
        adresse_code_postal: data.adresse_code_postal || null,
        adresse_pays: data.adresse_pays || null,
      };

      // Preserve existing fields that shouldn't be modified here
      if (profile) {
        profileData.role = profile.role;
        profileData.photo_url = profile.photo_url;
        profileData.specialisation = profile.specialisation;
        profileData.tarif_horaire = profile.tarif_horaire;
        profileData.annees_experience = profile.annees_experience;
      }

      const { error, data: upsertResult } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: "id", ignoreDuplicates: false });

      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }

      console.log("Upsert result:", upsertResult);

      // Refresh profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      if (!updatedProfile) {
        throw new Error("Profile not found after update");
      }

      setProfile(updatedProfile);
      setIsEditing(false);

      toast({
        title: "Profil mis à jour",
        description: `Vos informations ont été enregistrées : ${updatedProfile.prenom} ${updatedProfile.nom}`,
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      reset({
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        telephone: profile.telephone || "",
        bio: profile.bio || "",
        adresse_rue: profile.adresse_rue || "",
        adresse_ville: profile.adresse_ville || "",
        adresse_code_postal: profile.adresse_code_postal || "",
        adresse_pays: profile.adresse_pays || "",
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

  if (!user || !profile) {
    return null;
  }

  // Get initials for avatar
  const initials = (profile.prenom?.[0] || "") + (profile.nom?.[0] || "");

  return (
    <div className="container py-8 max-w-3xl">
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
            <h1 className="text-3xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Vos informations de base
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24">
                  {profile.photo_url ? (
                    <AvatarImage src={profile.photo_url} alt="Photo de profil" />
                  ) : (
                    <AvatarFallback className="text-2xl font-semibold">
                      {initials.toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {profile.prenom} {profile.nom}
                  </h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.role && (
                    <Badge className="mt-2">
                      {profile.role === "client" ? "Client" : "Vendeur"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Edit Toggle */}
              <div className="flex justify-end">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    {isEditing ? (
                      <Input
                        id="prenom"
                        {...register("prenom")}
                        className={errors.prenom ? "border-destructive" : ""}
                      />
                    ) : (
                      <p className="text-lg">{profile.prenom}</p>
                    )}
                    {errors.prenom && (
                      <p className="text-sm text-destructive">{errors.prenom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    {isEditing ? (
                      <Input
                        id="nom"
                        {...register("nom")}
                        className={errors.nom ? "border-destructive" : ""}
                      />
                    ) : (
                      <p className="text-lg">{profile.nom}</p>
                    )}
                    {errors.nom && (
                      <p className="text-sm text-destructive">{errors.nom.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-lg">{profile.email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      id="telephone"
                      type="tel"
                      {...register("telephone")}
                      placeholder="Ex: 06 12 34 56 78"
                    />
                  ) : (
                    <p className="text-lg">{profile.telephone || "Non renseigné"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Input
                      id="bio"
                      {...register("bio")}
                      placeholder="Ex: Passionné de mode durable..."
                    />
                  ) : (
                    <p className="text-lg">{profile.bio || "Non renseigné"}</p>
                  )}
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
            <CardDescription>
              Votre adresse postale
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adresse_rue">Rue et numéro</Label>
                {isEditing ? (
                  <Input
                    id="adresse_rue"
                    {...register("adresse_rue")}
                    placeholder="Ex: 123 Rue de la République"
                  />
                ) : (
                  <p className="text-lg">{profile.adresse_rue || "Non renseigné"}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse_code_postal">Code postal</Label>
                  {isEditing ? (
                    <Input
                      id="adresse_code_postal"
                      {...register("adresse_code_postal")}
                      placeholder="Ex: 75001"
                    />
                  ) : (
                    <p className="text-lg">{profile.adresse_code_postal || "Non renseigné"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse_ville">Ville</Label>
                  {isEditing ? (
                    <Input
                      id="adresse_ville"
                      {...register("adresse_ville")}
                      placeholder="Ex: Paris"
                    />
                  ) : (
                    <p className="text-lg">{profile.adresse_ville || "Non renseigné"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse_pays">Pays</Label>
                {isEditing ? (
                  <Input
                    id="adresse_pays"
                    {...register("adresse_pays")}
                    placeholder="Ex: France"
                  />
                ) : (
                  <p className="text-lg">{profile.adresse_pays || "Non renseigné"}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Vendeur specific info */}
        {profile.role === "vendeur" && (
          <Card>
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
              <CardDescription>
                Vos informations en tant que vendeur
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spécialisation</Label>
                    <p className="text-lg">{profile.specialisation || "Non renseigné"}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Années d'expérience</Label>
                    <p className="text-lg">{profile.annees_experience || "Non renseigné"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tarif horaire</Label>
                  <p className="text-lg">{profile.tarif_horaire ? `€${profile.tarif_horaire}/h` : "Non renseigné"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
