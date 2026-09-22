"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { envoyerLienEspace } from "@/lib/auth/espace-link";
import { roleFromMetadata } from "@/lib/auth/role";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

const dashboardForRole = (role: string) =>
  role === "seller" ? "/dashboard/seller" : "/dashboard/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const redirectTarget = searchParams.get("redirect");
  const showEmailPending = searchParams.get("email_pending") === "1";
  // Renvoyé par /api/auth/confirm quand le lien a expiré ou a déjà servi.
  const etatLien = searchParams.get("lien");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          const dashboard = profile ? dashboardForRole(profile.role) : "/dashboard/client";
          router.push(dashboard);
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [supabase, router]);
  // Connexion sans mot de passe : la cliente reçoit un lien par email.
  // C'est le mode par défaut pour les comptes créés depuis le formulaire
  // de demande, qui n'ont jamais défini de mot de passe.
  const [envoiLien, setEnvoiLien] = useState(false);
  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [messageLien, setMessageLien] = useState<string | null>(null);

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
    setMessageLien(null);
    const email = (form.getValues("email") || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setMessageLien("Indiquez d'abord votre adresse email ci-dessus.");
      return;
    }
    setEnvoiLien(true);
    try {
      // creerCompte: false — depuis la connexion, on ne fabrique pas de
      // compte à la volée : un espace naît avec une demande, pas ici.
      const resultat = await envoyerLienEspace({ email, creerCompte: false });
      switch (resultat.statut) {
        case "envoye":
          setLienEnvoye(true);
          return;
        case "compte_inconnu":
          setMessageLien(
            "Aucun espace n'existe encore pour cette adresse. Votre espace est créé en même temps que votre première demande d'estimation."
          );
          return;
        case "trop_de_demandes":
          setMessageLien(
            "Un lien vient déjà de partir vers cette adresse. Regardez votre boîte mail — et vos indésirables — avant d'en redemander un."
          );
          return;
        default:
          setMessageLien(
            "L'envoi du lien a échoué. Réessayez dans un instant, ou écrivez-nous si cela persiste."
          );
      }
    } finally {
      setEnvoiLien(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoginError(null);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();

      // On ne cherche plus le profil avant de tenter la connexion. Un espace
      // créé depuis le formulaire de demande n'a de profil qu'à partir du
      // premier clic sur son lien : la vérification annonçait donc « aucun
      // compte » à des clientes dont le compte existait bel et bien. Elle
      // lisait en prime la table profiles en anonyme.
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      });

      if (error) {
        // Supabase renvoie la même erreur pour une adresse inconnue et un
        // mauvais mot de passe : on couvre les deux, et on oriente vers le
        // lien de connexion, seule voie pour les espaces sans mot de passe.
        throw new Error(
          "Adresse email ou mot de passe incorrect. Si votre espace a été créé depuis le formulaire de demande, vous n'avez pas de mot de passe : demandez un lien de connexion ci-dessous."
        );
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
              role: roleFromMetadata(authData.user.user_metadata),
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

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <p className="text-gris-moyen">Vérification de votre session...</p>
      </div>
    );
  }

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
          {etatLien && (
            <div className="mb-4 rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                {etatLien === "expire"
                  ? "Ce lien de connexion a expiré ou a déjà servi. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."
                  : "Ce lien de connexion n'est pas valide. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."}
              </p>
            </div>
          )}
          {showEmailPending && (
            <div className="mb-4 rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                N&apos;oubliez pas de confirmer votre adresse e-mail pour activer votre
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
                {messageLien && (
                  <p className="mt-3 text-sm text-gris-moyen border-l-2 border-sauge-clair pl-4">
                    {messageLien}
                  </p>
                )}
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
