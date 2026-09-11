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
import { Profile, Role } from "@/types/database";
import { Mail, Phone, User, Home, MapPin, ArrowLeft, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

const profileFormSchema = z.object({
  last_name: z.string().min(2, "Le nom est requis"),
  first_name: z.string().min(2, "Le prénom est requis"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  street_address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(["client", "seller"]),
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
      last_name: "",
      first_name: "",
      phone: "",
      bio: "",
      street_address: "",
      city: "",
      postal_code: "",
      country: "",
      role: "client" as Role,
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
            last_name: profileData.last_name || "",
            first_name: profileData.first_name || "",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            street_address: profileData.street_address || "",
            city: profileData.city || "",
            postal_code: profileData.postal_code || "",
            country: profileData.country || "",
            role: profileData.role || "client",
          });
        } else {
          // Create a basic profile if it doesn't exist
          const { error: createError } = await supabase
            .from("profiles")
            .insert([{
              id: currentUser.id,
              email: currentUser.email,
              last_name: null,
              first_name: null,
              role: "client",
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
        last_name: data.last_name,
        first_name: data.first_name,
        phone: data.phone || null,
        bio: data.bio || null,
        street_address: data.street_address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        country: data.country || null,
      };

      // Preserve existing fields that shouldn't be modified here
      if (profile) {
        profileData.photo_url = profile.photo_url;
        profileData.specialization = profile.specialization;
        profileData.hourly_rate = profile.hourly_rate;
        profileData.years_experience = profile.years_experience;
      }

      // Use the role selected in the form
      profileData.role = data.role;

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

      const roleChanged = profile && profile.role !== updatedProfile.role;

      setProfile(updatedProfile);
      setIsEditing(false);

      toast({
        title: "Profil mis à jour",
        description: `Vos informations ont été enregistrées : ${updatedProfile.first_name} ${updatedProfile.last_name}`,
      });

      // Redirect to the dashboard matching the (possibly new) role
      if (roleChanged) {
        router.push(updatedProfile.role === "seller" ? "/dashboard/vendeur" : "/dashboard/client");
      }
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
        last_name: profile.last_name || "",
        first_name: profile.first_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        street_address: profile.street_address || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "",
        role: profile.role || "client",
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
  const initials = (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "");

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
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.role && (
                    <Badge className="mt-2">
                      {profile.role === "client" ? "Client" : "Vendeuse"}
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
                    <Label htmlFor="first_name">Prénom *</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        {...register("first_name")}
                        className={errors.first_name ? "border-destructive" : ""}
                      />
                    ) : (
                      <p className="text-lg">{profile.first_name}</p>
                    )}
                    {errors.first_name && (
                      <p className="text-sm text-destructive">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom *</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        {...register("last_name")}
                        className={errors.last_name ? "border-destructive" : ""}
                      />
                    ) : (
                      <p className="text-lg">{profile.last_name}</p>
                    )}
                    {errors.last_name && (
                      <p className="text-sm text-destructive">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-lg">{profile.email}</p>
                </div>

                {/* Role selection */}
                <div className="space-y-3">
                  <Label>Votre rôle</Label>
                  {isEditing ? (
                    <RadioGroup
                      defaultValue={profile.role || "client"}
                      onValueChange={(value) => setValue("role", value as Role)}
                      className="grid gap-3 pt-1"
                    >
                      <label
                        htmlFor="role-client"
                        className="flex items-start gap-3 rounded-lg border border-noir/15 p-4 cursor-pointer hover:bg-noir/5 transition-colors"
                      >
                        <RadioGroupItem value="client" id="role-client" className="mt-1" />
                        <div className="space-y-1">
                          <span className="block text-sm font-medium">Je veux vendre mes vêtements</span>
                          <span className="block text-sm text-muted-foreground">
                            Vous déposez vos pièces pour qu&apos;une vendeuse les reprenne.
                          </span>
                        </div>
                      </label>
                      <label
                        htmlFor="role-seller"
                        className="flex items-start gap-3 rounded-lg border border-noir/15 p-4 cursor-pointer hover:bg-noir/5 transition-colors"
                      >
                        <RadioGroupItem value="seller" id="role-seller" className="mt-1" />
                        <div className="space-y-1">
                          <span className="block text-sm font-medium">Je souhaite aider à vendre des vêtements</span>
                          <span className="block text-sm text-muted-foreground">
                            Vous triez et accompagnez les clientes dans la reprise de leurs pièces.
                          </span>
                        </div>
                      </label>
                    </RadioGroup>
                  ) : (
                    <p className="text-lg">
                      {profile.role === "seller"
                        ? "Je souhaite aider à vendre des vêtements"
                        : "Je veux vendre mes vêtements"}
                    </p>
                  )}
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="Ex: 06 12 34 56 78"
                    />
                  ) : (
                    <p className="text-lg">{profile.phone || "Non renseigné"}</p>
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
                <Label htmlFor="street_address">Rue et numéro</Label>
                {isEditing ? (
                  <Input
                    id="street_address"
                    {...register("street_address")}
                    placeholder="Ex: 123 Rue de la République"
                  />
                ) : (
                  <p className="text-lg">{profile.street_address || "Non renseigné"}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  {isEditing ? (
                    <Input
                      id="postal_code"
                      {...register("postal_code")}
                      placeholder="Ex: 75001"
                    />
                  ) : (
                    <p className="text-lg">{profile.postal_code || "Non renseigné"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Ex: Paris"
                    />
                  ) : (
                    <p className="text-lg">{profile.city || "Non renseigné"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                {isEditing ? (
                  <Input
                    id="country"
                    {...register("country")}
                    placeholder="Ex: France"
                  />
                ) : (
                  <p className="text-lg">{profile.country || "Non renseigné"}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Seller specific info */}
        {profile.role === "seller" && (
          <Card>
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
              <CardDescription>
                Vos informations en tant que vendeuse
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spécialisation</Label>
                    <p className="text-lg">{profile.specialization || "Non renseigné"}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Années d'expérience</Label>
                    <p className="text-lg">{profile.years_experience || "Non renseigné"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tarif horaire</Label>
                  <p className="text-lg">{profile.hourly_rate ? `€${profile.hourly_rate}/h` : "Non renseigné"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
