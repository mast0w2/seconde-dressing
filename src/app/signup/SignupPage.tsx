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
          // Marque cette confirmation comme issue d'une inscription : le
          // callback y répond en renvoyant vers /login (pour se connecter
          // avec le mot de passe qu'on vient de choisir), pas vers le
          // tableau de bord directement comme pour un lien de connexion.
          emailRedirectTo: `${window.location.origin}/api/auth/callback?flow=signup`,
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      placeholder="Léa"
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
                      placeholder="Martin"
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Inscription..." : "S'inscrire"}
                </Button>
            </form>
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
