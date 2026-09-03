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
import { Mail, Phone, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

const profileFormSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().optional(),
  bio: z.string().optional(),
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

      const { error } = await supabase
        .from("profiles")
        .upsert([{
          id: user.id,
          email: user.email,
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone || null,
          bio: data.bio || null,
          role: profile?.role || null,
          photo_url: profile?.photo_url || null,
          specialisation: profile?.specialisation || null,
          tarif_horaire: profile?.tarif_horaire || null,
          annees_experience: profile?.annees_experience || null,
        }], { onConflict: "id" });

      if (error) {
        throw error;
      }

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(updatedProfile);
      setIsEditing(false);

      toast({
        title: "Profil mis à jour",
        description: "Vos informations personnelles ont été enregistrées.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
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
      });
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
            <h1 className="text-3xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.photo_url || undefined} />
                <AvatarFallback className="text-2xl font-bold">
                  {profile?.prenom ? profile.prenom.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.prenom} {profile?.nom}
                </h2>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Information Display */}
            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Prénom
                    </Label>
                    <p className="text-lg">
                      {profile?.prenom || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Nom
                    </Label>
                    <p className="text-lg">
                      {profile?.nom || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </p>
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

                {profile?.bio && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Bio
                    </Label>
                    <p className="text-lg">{profile.bio}</p>
                  </div>
                )}

                {profile?.role && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Rôle
                    </Label>
                    <p className="text-lg capitalize">{profile.role}</p>
                  </div>
                )}

                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full md:w-auto"
                >
                  Modifier mon profil
                </Button>
              </div>
            ) : (
              /* Profile Edit Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
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
                      {...register("nom")}
                      className={errors.nom ? "border-destructive" : ""}
                    />
                    {errors.nom && (
                      <p className="text-sm text-destructive">{errors.nom.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    {...register("telephone")}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    {...register("bio")}
                    placeholder="Une courte description de vous"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  * Ces champs sont obligatoires
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Gérer votre compte et vos préférences
              </p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link href="/preferences">Préférences</Link>
                </Button>
                {profile?.role === "client" && (
                  <Button asChild variant="outline">
                    <Link href="/client/settings">Paramètres client</Link>
                  </Button>
                )}
                {profile?.role === "vendeuse" && (
                  <Button asChild variant="outline">
                    <Link href="/vendeuse/settings">Paramètres vendeuse</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
