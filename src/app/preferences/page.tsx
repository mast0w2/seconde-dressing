"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Preference } from "@/types/database";
import type { Theme } from "@/types/database";
import { ArrowLeft, Check, X } from "lucide-react";

export default function PreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<Preference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [theme, setTheme] = useState<Theme>("light");
  const [timezone, setTimezone] = useState<string>("Europe/Paris");
  const [notificationsEmail, setNotificationsEmail] = useState<boolean>(true);
  const [notificationsSms, setNotificationsSms] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("preferences")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        if (preferencesError && preferencesError.code !== "PGRST116") {
          console.error("Error fetching preferences:", preferencesError);
        }

        if (preferencesData) {
          setPreferences(preferencesData);
          setLanguage(preferencesData.language || "FR");
          setTheme(preferencesData.theme || "light");
          setTimezone(preferencesData.timezone || "Europe/Paris");
          setNotificationsEmail(preferencesData.email_notifications || true);
          setNotificationsSms(preferencesData.sms_notifications || false);
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
  }, [supabase, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour modifier vos préférences.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const preferencesData = {
        user_id: user.id,
        language,
        timezone,
        theme,
        email_notifications: notificationsEmail,
        sms_notifications: notificationsSms,
      };

      const { error } = await supabase
        .from("preferences")
        .upsert([preferencesData], { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      // Refresh preferences
      const { data: updatedPreferences } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setPreferences(updatedPreferences);

      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
            <h1 className="text-3xl">Préférences</h1>
            <p className="text-gris-moyen">
              Configurez vos préférences d&apos;utilisation
            </p>
          </div>
        </div>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres généraux</CardTitle>
            <CardDescription>
              Personnalisez votre expérience sur Seconde
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Langue */}
              <div className="space-y-2">
                <Label htmlFor="langue" className="text-sm font-medium">
                  Langue
                </Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "FR" | "EN")}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="FR">Français</option>
                  <option value="EN">Anglais</option>
                </select>
              </div>

              {/* Fuseau horaire */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Fuseau horaire
                </Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                </select>
              </div>

              {/* Thème */}
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">
                  Thème
                </Label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notifications</h3>
                
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                      notificationsEmail ? "bg-noir border-noir" : "border-gris-clair"
                    }`}
                    onClick={() => setNotificationsEmail(!notificationsEmail)}
                  >
                    {notificationsEmail && <Check className="h-4 w-4 text-blanc" />}
                  </div>
                  <Label className="text-sm font-medium cursor-pointer" onClick={() => setNotificationsEmail(!notificationsEmail)}>
                    Notifications par email
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                      notificationsSms ? "bg-noir border-noir" : "border-gris-clair"
                    }`}
                    onClick={() => setNotificationsSms(!notificationsSms)}
                  >
                    {notificationsSms && <Check className="h-4 w-4 text-blanc" />}
                  </div>
                  <Label className="text-sm font-medium cursor-pointer" onClick={() => setNotificationsSms(!notificationsSms)}>
                    Notifications par SMS
                  </Label>
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? "Enregistrement..." : "Enregistrer les préférences"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
