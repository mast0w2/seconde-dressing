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
import { createBrowserClient } from "@supabase/ssr";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

const dashboardForRole = (role: string) =>
  role === "seller" ? "/dashboard/vendeur" : "/dashboard/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const redirectTarget = searchParams.get("redirect");
  const showEmailPending = searchParams.get("email_pending") === "1";
  const [loginError, setLoginError] = useState<string | null>(null);
  // Connexion sans mot de passe : la cliente reçoit un lien par email.
  // C'est le mode par défaut pour les comptes créés depuis le formulaire
  // de demande, qui n'ont jamais défini de mot de passe.
  const [envoiLien, setEnvoiLien] = useState(false);
  const [lienEnvoye, setLienEnvoye] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const envoyerLien = async () => {
    setLoginError(null);
    const email = (form.getValues("email") || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setLoginError("Indiquez d'abord votre adresse email ci-dessus.");
      return;
    }
    setEnvoiLien(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) {
        setLoginError(error.message);
        return;
      }
      setLienEnvoye(true);
    } finally {
      setEnvoiLien(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoginError(null);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();

      // Supabase Auth returns the same "Invalid login credentials" for both a
      // non-existent email and a wrong password. To give a precise message, we
      // first check whether a profile exists for this email: if not, the email
      // is not linked to any account; otherwise a sign-in failure means the
      // password is wrong.
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (profileLookupError) {
        throw profileLookupError;
      }

      if (!existingProfile) {
        throw new Error("Aucun compte n'est lié à cette adresse email.");
      }

      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      });

      if (error) {
        throw new Error("Mauvais mot de passe.");
      }

      if (!authData.user) {
        throw new Error("User not found");
      }

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      // No profile row yet (e.g. table recreated by the SQL migration, or the
      // signup profile insert failed): create a minimal one so the user can
      // land on a dashboard, then complete their details from /profile.
      if (profileError && profileError.code === "PGRST116") {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              first_name: "",
              last_name: "",
              role: "client",
            },
          ])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        profile = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      const isProfileComplete =
        profile && profile.first_name && profile.last_name;

      const destination = redirectTarget
        ? redirectTarget
        : isProfileComplete
        ? dashboardForRole(profile.role)
        : "/profile";

      // Refresh the router cache so the middleware and server components
      // pick up the new auth session before navigating to a protected route.
      router.refresh();
      router.push(destination);

      toast({
        title: "Connexion réussie",
        description: isProfileComplete
          ? "Vous êtes maintenant connecté."
          : "Veuillez compléter votre profil pour finaliser votre compte.",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Se connecter</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailPending && (
            <div className="mb-4 rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                N'oubliez pas de confirmer votre adresse e-mail pour activer votre
                compte. Cliquez sur le lien reçu par e-mail, puis connectez-vous.
              </p>
            </div>
          )}
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
              <Link href="/forgot-password" className="text-sm text-sauge-fonce hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            {loginError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{loginError}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          {/* Connexion par lien : indispensable pour les comptes créés depuis
              le formulaire de demande, qui n'ont pas de mot de passe. */}
          <div className="mt-6 border-t border-noir/10 pt-6">
            {lienEnvoye ? (
              <p className="text-sm text-gris-moyen">
                Un lien de connexion vient de partir vers votre adresse. Cliquez dessus pour
                accéder à votre espace — pensez à regarder dans vos indésirables.
              </p>
            ) : (
              <>
                <p className="text-sm text-gris-moyen">
                  Vous avez créé votre espace depuis le formulaire de demande et vous
                  n&apos;avez pas de mot de passe ?
                </p>
                <button
                  type="button"
                  onClick={envoyerLien}
                  disabled={envoiLien}
                  className="mt-3 w-full border border-noir px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-noir hover:bg-noir hover:text-blanc transition-colors disabled:opacity-50"
                >
                  {envoiLien ? "Envoi en cours…" : "Recevoir un lien de connexion"}
                </button>
              </>
            )}
          </div>

          {/* Une cliente n'a pas à s'inscrire : son espace est créé quand elle
              envoie sa demande. L'inscription directe ne concerne que les
              vendeuses. Envoyer tout le monde vers /signup créait des comptes
              vides, sans aucune demande à suivre. */}
          <div className="mt-6 border-t border-noir/10 pt-6 flex flex-col gap-3 text-sm text-gris-moyen">
            <p>
              Vous n&apos;avez pas encore d&apos;espace ? Il est créé automatiquement quand
              vous{" "}
              <Link href="/#estimation-form" className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors">
                demandez un rendez-vous
              </Link>
              .
            </p>
            <p>
              Vous souhaitez devenir vendeuse ?{" "}
              <Link href="/signup?vendeur=true" className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors">
                Créer un compte vendeuse
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
