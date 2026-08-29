"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import type { Role } from "@/types/database";

export default function RolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        router.push("/");
        return;
      }

      setIsLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  const handleSelectRole = async (role: Role) => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      // Get temp user data from session storage
      const tempUser = sessionStorage.getItem("tempUser");
      const tempData = tempUser ? JSON.parse(tempUser) : null;

      const profileData = {
        id: user.id,
        email: tempData?.email || user.email,
        nom: tempData?.nom || "",
        prenom: tempData?.prenom || "",
        role,
        telephone: null,
        photo_url: null,
        bio: null,
        specialisation: null,
        tarif_horaire: null,
        annees_experience: null,
      };

      const { error } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (error) {
        throw error;
      }

      // Create default preferences
      const { error: prefError } = await supabase
        .from("preferences")
        .insert([{
          user_id: user.id,
          langue: "FR" as const,
          fuseau_horaire: "Europe/Paris",
          theme: "clair" as const,
          notifications_email: true,
          notifications_sms: false,
          preferences_ventes: null,
        }]);

      if (prefError) {
        console.error("Error creating preferences:", prefError);
      }

      // Clear temp data
      sessionStorage.removeItem("tempUser");

      toast({
        title: "Rôle sélectionné",
        description: `Vous êtes maintenant ${role === "client" ? "un client" : "une vendeuse"}.`,
      });

      router.push("/");
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
          <CardTitle className="text-2xl">Choisir votre rôle</CardTitle>
          <CardDescription>
            Sélectionnez votre rôle pour continuer sur Seconde Dressing
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez changer votre rôle plus tard dans les paramètres.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectRole("client")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 text-4xl">👗</div>
                <CardTitle className="text-center">Client</CardTitle>
                <CardDescription className="text-center text-sm">
                  Je veux vendre mes vêtements
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectRole("vendeuse")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 text-4xl">👩‍💼</div>
                <CardTitle className="text-center">Vendeuse</CardTitle>
                <CardDescription className="text-center text-sm">
                  Je suis une vendeuse professionnelle
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Annuler
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
