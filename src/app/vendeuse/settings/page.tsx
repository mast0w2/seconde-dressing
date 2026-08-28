"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/Form/ProfileForm";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Preference } from "@/types/database";

export default function VendeuseSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user is a vendeuse
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profileData?.role !== "vendeuse") {
          router.push("/");
          return;
        }

        setProfile(profileData);

        // Fetch preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (preferencesError) {
          console.error("Error fetching preferences:", preferencesError);
        } else {
          setPreferences(preferencesData);
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

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => {
        await fetchData();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, toast]);

  const handleProfileSuccess = () => {
    // Refresh profile data
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    };
    fetchProfile();
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const langue = formData.get("langue") as "FR" | "EN";
      const theme = formData.get("theme") as "clair" | "sombre";
      const notifications_email = formData.get("notifications_email") === "on";
      const notifications_sms = formData.get("notifications_sms") === "on";

      const preferencesData = {
        user_id: user.id,
        langue,
        fuseau_horaire: formData.get("fuseau_horaire") as string,
        theme,
        notifications_email,
        notifications_sms,
        preferences_ventes: null,
      };

      const { error } = await supabase
        .from("preferences")
        .upsert([preferencesData], { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences ont été mises à jour avec succès.",
      });

      // Refresh preferences
      const { data: preferencesData } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setPreferences(preferencesData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <p className="text-lg text-destructive">
          Profil non trouvé.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre profil et vos préférences
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-none">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Mon profil</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  profile={profile}
                  role={profile.role}
                  onSuccess={handleProfileSuccess}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>
                  Configurez vos préférences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Langue</label>
                    <select
                      name="langue"
                      defaultValue={preferences?.langue || "FR"}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="FR">Français</option>
                      <option value="EN">Anglais</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fuseau horaire</label>
                    <select
                      name="fuseau_horaire"
                      defaultValue={preferences?.fuseau_horaire || "Europe/Paris"}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thème</label>
                    <select
                      name="theme"
                      defaultValue={preferences?.theme || "clair"}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="clair">Clair</option>
                      <option value="sombre">Sombre</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications_email"
                      name="notifications_email"
                      defaultChecked={preferences?.notifications_email || true}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="notifications_email" className="text-sm font-medium">
                      Notifications par email
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notifications_sms"
                      name="notifications_sms"
                      defaultChecked={preferences?.notifications_sms || false}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="notifications_sms" className="text-sm font-medium">
                      Notifications par SMS
                    </label>
                  </div>

                  <Button type="submit" className="w-full">
                    Enregistrer les préférences
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
