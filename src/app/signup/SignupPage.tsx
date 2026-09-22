"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import { capitalizeName } from "@/lib/text";
import type { Role } from "@/types/database";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  prenom: z.string().min(2, "Le prénom est requis"),
  nom: z.string().min(2, "Le nom est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const ROLE_OPTIONS: Array<{ role: Role; title: string; description: string }> = [
  {
    role: "client",
    title: "Cliente",
    description: "Je veux vendre mes vêtements et suivre mes demandes.",
  },
  {
    role: "seller",
    title: "Vendeuse",
    description: "J'accompagne des clientes et je vends leurs pièces pour elles.",
  },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  // Quel que soit le point d'entrée (lien "Devenir vendeuse", accès direct à
  // /signup, etc.), on demande toujours explicitement le rôle : le paramètre
  // ?vendeur=true ne fait que pré-sélectionner une réponse, il ne la choisit
  // pas à la place de la personne.
  const [role, setRole] = useState<Role | null>(
    searchParams.get("vendeur") === "true" ? "seller" : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      prenom: "",
      nom: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    if (!role) return;

    try {
      const {
        data: { user, session },
        error: authError,
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("User not found after signup");
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          first_name: capitalizeName(data.prenom),
          last_name: capitalizeName(data.nom),
          phone: null,
          photo_url: null,
          street_address: null,
          role,
          bio: null,
          specialization: null,
          hourly_rate: null,
          years_experience: null,
        },
      ]);

      if (profileError) {
        throw profileError;
      }

      if (!session) {
        // Confirmation d'email requise : on le montre sur un écran dédié
        // plutôt qu'un toast (qui disparaît) suivi d'une redirection vers
        // /login — c'était trop facile à manquer et laissait penser que
        // l'inscription avait échoué ou qu'on pouvait se connecter tout de
        // suite.
        setConfirmationEmail(data.email);
        return;
      }

      // Une cliente a pu envoyer une demande anonymement avant de créer ce
      // compte : on rattache ces demandes maintenant (idempotent, sans effet
      // si aucune ne correspond à cette adresse).
      await attachAnonymousRequests(supabase);

      toast({
        title: "Bienvenue sur Seconde !",
        description: "Votre compte a été créé. Complétez votre profil pour finaliser votre inscription.",
      });

      router.push("/profile");
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    if (!role) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Google ne fournit pas de prénom/nom séparés dans nos métadonnées :
          // le rôle choisi ici voyage dans l'URL de retour pour que le
          // callback sache quel compte créer.
          redirectTo: `${window.location.origin}/api/auth/callback?role=${role}`,
        },
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

  if (confirmationEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Vérifiez votre boîte mail</CardTitle>
            <CardDescription>Confirmez votre adresse pour activer votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                Un email de confirmation vient de partir vers{" "}
                <span className="font-medium">{confirmationEmail}</span>. Cliquez sur le
                lien qu&apos;il contient pour activer votre compte — vous pourrez ensuite
                vous connecter avec le mot de passe que vous venez de choisir.
              </p>
            </div>
            <p className="text-sm text-gris-moyen">
              Rien reçu au bout de quelques minutes ? Pensez à regarder dans vos
              indésirables.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Aller à la page de connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            {role === "seller"
              ? "Créez votre compte vendeuse pour accompagner les clientes et vendre leurs pièces."
              : role === "client"
              ? "Créez votre compte pour envoyer vos demandes et suivre leur avancement."
              : "Choisissez le type de compte à créer pour commencer."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.role;
              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => setRole(option.role)}
                  aria-pressed={selected}
                  className={`text-left border p-4 transition-colors ${
                    selected
                      ? "border-noir bg-sauge-clair/30"
                      : "border-noir/20 hover:border-noir/50"
                  }`}
                >
                  <span className="block font-serif text-lg text-noir">{option.title}</span>
                  <span className="block text-sm text-gris-moyen mt-1">{option.description}</span>
                </button>
              );
            })}
          </div>

          {role === "client" && (
            <p className="mb-6 text-sm text-gris-moyen">
              Vous voulez simplement envoyer une demande sans créer de compte tout de suite ?{" "}
              <Link
                href="/#appointment-request-form"
                className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
              >
                Faites votre demande
              </Link>{" "}
              — votre espace se crée alors automatiquement.
            </p>
          )}

          {role && (
            <>
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

                <p className="text-xs text-gris-moyen">
                  Un email de confirmation vous sera envoyé : il faudra cliquer sur son lien
                  avant de pouvoir vous connecter.
                </p>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-blanc text-gris-moyen">ou</span>
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
            </>
          )}
          <p className="mt-4 text-center text-sm text-gris-moyen">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-sauge-fonce hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
