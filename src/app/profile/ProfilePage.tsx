"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { Mail, Phone, User, Home, MapPin, ArrowLeft, Edit, Save, X, Camera } from "lucide-react";
import { AddressInput } from "@/components/ui/address-input";
import { Badge } from "@/components/ui/badge";
import { capitalizeName } from "@/lib/text";
import { roleFromMetadata } from "@/lib/auth/role";
import Link from "next/link";

const profileFormSchema = z.object({
  last_name: z.string().min(2, "Le nom est requis"),
  first_name: z.string().min(2, "Le prénom est requis"),
  phone: z.string().min(10, "Le numéro de téléphone est requis"),
  bio: z.string().optional(),
  street_address: z.string().min(5, "L'adresse est requise"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showIncompleteBanner = searchParams.get("incomplete") === "1";
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      last_name: "",
      first_name: "",
      phone: "",
      bio: "",
      street_address: "",
    },
  });

  const { handleSubmit, register, formState, setValue, reset, watch } = form;
  const { errors, isSubmitting } = formState;
  const streetAddressValue = watch("street_address");

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
              role: roleFromMetadata(currentUser.user_metadata),
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
        last_name: capitalizeName(data.last_name),
        first_name: capitalizeName(data.first_name),
        phone: data.phone || null,
        bio: data.bio || null,
        street_address: data.street_address || null,
      };

      if (profile) {
        profileData.photo_url = profile.photo_url;
        profileData.role = profile.role;
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
        description: `Vos informations ont été enregistrées : ${updatedProfile.first_name} ${updatedProfile.last_name}`,
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
        last_name: profile.last_name || "",
        first_name: profile.first_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        street_address: profile.street_address || "",
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size (max 5MB)
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image doit faire moins de 5 Mo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName;

      // Upload to the 'avatars' bucket, replacing any existing photo for this user
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Persist the photo URL on the profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: photoUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((prev) => (prev ? { ...prev, photo_url: photoUrl } : prev));

      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'upload de la photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  return (
    <div className="container py-8 max-w-3xl">
      <div className="space-y-6">
        {showIncompleteBanner && (
          <div className="rounded-md border border-amber-500/60 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              Il manque des informations dans votre profil personnel. Veuillez les
              remplir pour accéder à votre tableau de bord.
            </p>
          </div>
        )}

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
            <h1 className="text-3xl">Mon profil</h1>
            <p className="text-gris-moyen">
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
              {/* Avatar with photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    aria-label="Changer la photo de profil"
                    className="relative block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
                  >
                    <Avatar className="w-24 h-24">
                      {profile.photo_url ? (
                        <AvatarImage src={profile.photo_url} alt="Photo de profil" />
                      ) : (
                        <AvatarFallback className="bg-creme border-2 border-dashed border-noir/30">
                          {isUploadingPhoto ? (
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-noir border-t-transparent" />
                          ) : (
                            <Camera className="h-8 w-8 text-noir/50" />
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {profile.photo_url && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-noir/0 group-hover:bg-noir/50 transition-colors">
                        {isUploadingPhoto ? (
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-blanc border-t-transparent" />
                        ) : (
                          <Camera className="h-6 w-6 text-blanc opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-2xl flex items-center gap-2">
                    {capitalizeName(profile.first_name)} {capitalizeName(profile.last_name)}
                    <Badge variant="secondary" className="text-xs font-normal">
                      {profile.role === "seller" ? "Vendeuse" : "Cliente"}
                    </Badge>
                  </h2>
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
                      <p className="text-lg">{capitalizeName(profile.first_name)}</p>
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
                      <p className="text-lg">{capitalizeName(profile.last_name)}</p>
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

                {/* Role is immutable: shown only as a read-only badge in the header. */}

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
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
                <Label htmlFor="street_address">Adresse *</Label>
                {isEditing ? (
                  <AddressInput
                    id="street_address"
                    value={streetAddressValue}
                    onChange={(v) => setValue("street_address", v, { shouldValidate: false })}
                    onPick={(picked) =>
                      setValue("street_address", picked.label, { shouldValidate: true })
                    }
                    placeholder="Commencez à taper votre adresse…"
                  />
                ) : (
                  <p className="text-lg">{profile.street_address || "Non renseigné"}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileForm />
    </Suspense>
  );
}
