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
import { isProfileComplete, dashboardPathForRole } from "@/lib/profile";
import { envoyerLienEspace } from "@/lib/auth/espace-link";
import { readAccountState, sendPasswordSetupLink } from "@/lib/auth/account-state";
import { roleFromMetadata } from "@/lib/auth/role";

const emailSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/**
 * Signing in happens in two steps: the address first, then whatever that
 * address actually turns out to be.
 *
 *  - no account           → say so, and offer to create one;
 *  - space with no password → send the link that lets them choose one;
 *  - account with password  → ask for the password.
 *
 * `fallback` is the fourth case, the one where the server cannot answer
 * (service role key missing, migration 0012 not applied yet): we then go back
 * to the former screen, password and emailed link side by side, rather than
 * leaving anyone in front of a closed door.
 */
type Step =
  | { name: "email" }
  | { name: "password"; email: string; fallback: boolean }
  | { name: "noAccount"; email: string }
  | { name: "linkSent"; email: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const redirectTarget = searchParams.get("redirect");
  const showConfirmed = searchParams.get("confirmed") === "1";
  // Set by /api/auth/confirm when the link expired or had already been used.
  const linkState = searchParams.get("lien");
  const [step, setStep] = useState<Step>({ name: "email" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
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

          const dashboard = profile ? dashboardPathForRole(profile.role) : "/dashboard/client";
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

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const backToEmail = () => {
    setLoginError(null);
    setLinkMessage(null);
    passwordForm.reset({ password: "" });
    setStep({ name: "email" });
  };

  // Step 1: what does this address correspond to?
  const onSubmitEmail = async ({ email }: EmailValues) => {
    setLoginError(null);
    setLinkMessage(null);
    const normalizedEmail = email.trim().toLowerCase();

    const state = await readAccountState(normalizedEmail);

    switch (state) {
      case "has_password":
        setStep({ name: "password", email: normalizedEmail, fallback: false });
        return;

      case "no_account":
        setStep({ name: "noAccount", email: normalizedEmail });
        return;

      case "no_password": {
        // The space exists — born from the request form — but nobody ever set
        // a password on it. Send the link that lets them choose one instead of
        // asking for one that does not exist.
        const sent = await sendPasswordSetupLink(normalizedEmail);
        if (sent === "sent" || sent === "rate_limited") {
          setLinkMessage(
            sent === "rate_limited"
              ? "Un lien vient déjà de partir vers cette adresse. Regardez votre boîte mail — et vos indésirables — avant d'en redemander un."
              : null
          );
          setStep({ name: "linkSent", email: normalizedEmail });
          return;
        }
        setLoginError(
          "L'envoi du lien a échoué. Réessayez dans un instant, ou écrivez-nous si cela persiste."
        );
        return;
      }

      case "rate_limited":
        setLoginError(
          "Trop de tentatives depuis cet appareil. Patientez quelques minutes avant de réessayer."
        );
        return;

      case "invalid_email":
        emailForm.setError("email", { message: "Adresse email invalide" });
        return;

      default:
        // We do not know: show the complete screen rather than blocking.
        setStep({ name: "password", email: normalizedEmail, fallback: true });
    }
  };

  // Step 2: the password.
  const onSubmitPassword = async ({ password }: PasswordValues) => {
    if (step.name !== "password") return;
    setLoginError(null);

    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: step.email,
        password,
      });

      if (error) {
        // On the nominal path we already know the account exists and has a
        // password: the error can only be the password itself. In fallback
        // mode Supabase conflates an unknown address with a wrong password,
        // hence the broader wording.
        throw new Error(
          step.fallback
            ? "Adresse email ou mot de passe incorrect. Si votre espace a été créé depuis le formulaire de demande, vous n'avez pas de mot de passe : demandez un lien de connexion ci-dessous."
            : "Mot de passe incorrect. Réessayez, ou utilisez « Mot de passe oublié ? » pour en choisir un nouveau."
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

      // Same completeness rule everywhere (dashboards, the email-link callback,
      // and here) so a login never bounces the user between pages depending
      // on which path they signed in through.
      const profileComplete = isProfileComplete(profile);

      const destination = redirectTarget
        ? redirectTarget
        : profileComplete
        ? dashboardPathForRole(profile.role)
        : "/profile?incomplete=1";

      // Refresh the router cache so the middleware and server components
      // pick up the new auth session before navigating to a protected route.
      router.refresh();
      router.push(destination);

      toast({
        title: "Connexion réussie",
        description: profileComplete
          ? "Vous êtes maintenant connecté."
          : "Veuillez compléter votre profil pour finaliser votre compte.",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Email ou mot de passe incorrect.");
    }
  };

  // Fallback path only: when the server could not tell us which case we are
  // in, this button stays the only way through for a space with no password.
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const sendSignInLink = async () => {
    if (step.name !== "password") return;
    setLoginError(null);
    setLinkMessage(null);
    setSendingLink(true);
    try {
      // creerCompte: false — from the login page we do not mint an account on
      // the fly: a space is born with a request, not here.
      const result = await envoyerLienEspace({ email: step.email, creerCompte: false });
      switch (result.statut) {
        case "envoye":
          setLinkSent(true);
          return;
        case "compte_inconnu":
          setLinkMessage(
            "Aucun espace n'existe encore pour cette adresse. Faites votre demande de rendez-vous depuis la page d'accueil : votre espace se créera automatiquement."
          );
          return;
        case "trop_de_demandes":
          setLinkMessage(
            "Un lien vient déjà de partir vers cette adresse. Regardez votre boîte mail — et vos indésirables — avant d'en redemander un."
          );
          return;
        default:
          setLinkMessage(
            "L'envoi du lien a échoué. Réessayez dans un instant, ou écrivez-nous si cela persiste."
          );
      }
    } finally {
      setSendingLink(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <p className="text-gris-moyen">Vérification de votre session...</p>
      </div>
    );
  }

  const heading = {
    email: {
      title: "Se connecter",
      subtitle: "Indiquez votre adresse email pour continuer",
    },
    password: {
      title: "Votre mot de passe",
      subtitle: "Dernière étape avant votre espace",
    },
    noAccount: {
      title: "Aucun compte trouvé",
      subtitle: "Cette adresse ne correspond à aucun compte",
    },
    linkSent: {
      title: "Vérifiez votre boîte mail",
      subtitle: "Un lien de création de compte vient de partir",
    },
  }[step.name];

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{heading.title}</CardTitle>
          <CardDescription>{heading.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {step.name === "email" && linkState && (
            <div className="mb-4 rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                {linkState === "expire"
                  ? "Ce lien de connexion a expiré ou a déjà servi. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."
                  : "Ce lien de connexion n'est pas valide. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."}
              </p>
            </div>
          )}
          {step.name === "email" && showConfirmed && (
            <div className="mb-4 rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                Votre adresse email est confirmée. Vous pouvez maintenant vous connecter avec
                le mot de passe choisi lors de l&apos;inscription.
              </p>
            </div>
          )}

          {/* --- Step 1: the address --- */}
          {step.name === "email" && (
            <>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    {...emailForm.register("email")}
                    className={emailForm.formState.errors.email ? "border-destructive" : ""}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                {loginError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                    <p className="text-sm text-destructive">{loginError}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailForm.formState.isSubmitting}
                >
                  {emailForm.formState.isSubmitting ? "Vérification..." : "Continuer"}
                </Button>
              </form>

              <div className="mt-6 border-t border-noir/10 pt-6 text-sm text-gris-moyen">
                <p>
                  Vous n&apos;avez pas encore de compte ?{" "}
                  <Link
                    href="/signup"
                    className="text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
                  >
                    Créer un compte
                  </Link>
                  .
                </p>
              </div>
            </>
          )}

          {/* --- Step 2a: the password --- */}
          {step.name === "password" && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-noir/10 bg-creme/60 px-3 py-2">
                <span className="truncate text-sm text-noir">{step.email}</span>
                <button
                  type="button"
                  onClick={backToEmail}
                  className="shrink-0 text-sm text-sauge-fonce underline underline-offset-4 hover:text-noir transition-colors"
                >
                  Modifier
                </button>
              </div>

              <form
                onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                className="space-y-4"
              >
                {/* Hidden field: password managers need the username to offer
                    the right entry. */}
                <input
                  type="email"
                  value={step.email}
                  autoComplete="username"
                  readOnly
                  hidden
                />
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    autoFocus
                    {...passwordForm.register("password")}
                    className={passwordForm.formState.errors.password ? "border-destructive" : ""}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.password.message}
                    </p>
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>

              {/* Fallback only: on the nominal path a space with no password
                  never reaches this screen. */}
              {step.fallback && (
                <div className="mt-6 border-t border-noir/10 pt-6">
                  {linkSent ? (
                    <p className="text-sm text-gris-moyen">
                      Un lien de connexion vient de partir vers votre adresse. Cliquez dessus
                      pour accéder à votre espace — pensez à regarder dans vos indésirables.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gris-moyen">
                        Vous avez créé votre espace depuis le formulaire de demande et vous
                        n&apos;avez pas de mot de passe ?
                      </p>
                      {linkMessage && (
                        <p className="mt-3 text-sm text-gris-moyen border-l-2 border-sauge-clair pl-4">
                          {linkMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={sendSignInLink}
                        disabled={sendingLink}
                        className="mt-3 w-full border border-noir px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-noir hover:bg-noir hover:text-blanc transition-colors disabled:opacity-50"
                      >
                        {sendingLink ? "Envoi en cours…" : "Recevoir un lien de connexion"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* --- Step 2b: no account --- */}
          {step.name === "noAccount" && (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  L&apos;adresse <span className="font-medium">{step.email}</span> n&apos;est
                  associée à aucun compte.
                </p>
              </div>
              <p className="text-sm text-gris-moyen">
                Vous avez peut-être utilisé une autre adresse — sinon, créez votre compte, cela
                prend une minute.
              </p>
              <Button asChild className="w-full">
                <Link href={`/signup?email=${encodeURIComponent(step.email)}`}>
                  Créer un compte
                </Link>
              </Button>
              <button
                type="button"
                onClick={backToEmail}
                className="w-full border border-noir px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-noir hover:bg-noir hover:text-blanc transition-colors"
              >
                Saisir une autre adresse
              </button>
            </div>
          )}

          {/* --- Step 2c: space with no password --- */}
          {step.name === "linkSent" && (
            <div className="space-y-4">
              <div className="rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
                <p className="text-sm text-sauge-fonce">
                  Votre espace existe, mais aucun mot de passe ne lui est encore associé. Un
                  lien de création de compte vient de partir vers{" "}
                  <span className="font-medium">{step.email}</span> : cliquez dessus pour
                  choisir votre mot de passe.
                </p>
              </div>
              {linkMessage && (
                <p className="text-sm text-gris-moyen border-l-2 border-sauge-clair pl-4">
                  {linkMessage}
                </p>
              )}
              <p className="text-sm text-gris-moyen">
                Rien reçu au bout de quelques minutes ? Pensez à regarder dans vos indésirables.
              </p>
              <button
                type="button"
                onClick={backToEmail}
                className="w-full border border-noir px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-noir hover:bg-noir hover:text-blanc transition-colors"
              >
                Saisir une autre adresse
              </button>
            </div>
          )}
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
