"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  confirmPassword: z.string().min(6, "Les mots de passe ne correspondent pas"),
  prenom: z.string().min(2, "Le prénom est requis"),
  nom: z.string().min(2, "Le nom est requis"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Check if vendeur=true is in URL
  const isVendeurSignup = searchParams.get('vendeur') === 'true';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      prenom: "",
      nom: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    try {
      // First, create the auth user
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      // Get the user to create the profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User not found after signup");
      }

      // Create the profile with role based on URL param
      const role = isVendeurSignup ? 'vendeur' : null;
      
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: user.id,
          email: user.email,
          nom: data.nom,
          prenom: data.prenom,
          telephone: null,
          photo_url: null,
          role: role,
          bio: null,
          specialisation: null,
          tarif_horaire: null,
          annees_experience: null,
        }]);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });

      // Redirect based on role
      if (role === 'vendeur') {
        router.push("/vendeur");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isVendeurSignup ? "Devenir Vendeur" : "Créer un compte"}
          </CardTitle>
          <CardDescription>
            {isVendeurSignup 
              ? "Inscrivez-vous pour devenir vendeur partenaire" 
              : "Inscrivez-vous pour commencer à utiliser Seconde"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
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
                <Label htmlFor="nom">Nom</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Inscription..." : isVendeurSignup ? "Devenir Vendeur" : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  ou
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              type="button"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              S&apos;inscrire avec Google
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
