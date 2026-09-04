"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Check if it's an "user not found" or "invalid credentials" error
        const errorMessage = error.message?.toLowerCase();
        const isUserNotFound = errorMessage.includes("user not found") || 
                             errorMessage.includes("invalid login credentials") ||
                             errorMessage.includes("invalid email");
        
        if (isUserNotFound) {
          throw new Error("Aucun compte trouvé avec cette adresse email. Veuillez vérifier votre email ou créer un compte.");
        }
        
        // For other errors, use the original message
        throw error;
      }

      if (!authData.user) {
        throw new Error("User not found");
      }

      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      if (profile) {
        // Profile exists, redirect based on role
        if (profile.role === "vendeur") {
          router.push("/vendeur");
        } else {
          router.push("/");
        }
        
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
      } else {
        // This shouldn't happen with the new flow, but handle it gracefully
        router.push("/");
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Se connecter</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte ?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              S&apos;inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
