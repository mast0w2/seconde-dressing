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
 *  - no account             → say so, and offer to create one;
 *  - space with no password → the account does not exist yet; a setup link
 *                             goes out and the screen says so;
 *  - account with password  → ask for the password.
 *
 * Every screen offers exactly one way forward. In particular the password
 * screen offers nothing but the password: no emailed-link escape hatch beside
 * it, which would only invite people to take the wrong door.
 *
 * There is no degraded mode. When the server cannot tell which case we are in,
 * we stay on step 1 and say so, rather than quietly showing a password field
 * to someone who may not have a password at all. That makes the page depend on
 * migration 0014 and on SUPABASE_SERVICE_ROLE_KEY: both must be in place
 * before this code ships.
 */
type Step =
  | { name: "email" }
  | { name: "password"; email: string }
  | { name: "noAccount"; email: string }
  | { name: "passwordSetup"; email: string };

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
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
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
    setSetupNotice(null);
    passwordForm.reset({ password: "" });
    setStep({ name: "email" });
  };

  // Step 1: what does this address correspond to?
  const onSubmitEmail = async ({ email }: EmailValues) => {
    setLoginError(null);
    setSetupNotice(null);
    const normalizedEmail = email.trim().toLowerCase();

    const state = await readAccountState(normalizedEmail);

    switch (state) {
      case "has_password":
        setStep({ name: "password", email: normalizedEmail });
        return;

      case "no_account":
        setStep({ name: "noAccount", email: normalizedEmail });
        return;

      case "no_password": {
        // The space exists — born from the request form — but nobody ever set
        // a password on it, so there is no account to sign into yet. Send the
        // setup link straight away: asking for a second click here would add a
        // button without adding a decision.
        const sent = await sendPasswordSetupLink(normalizedEmail);
        if (sent === "sent" || sent === "rate_limited") {
          setSetupNotice(
            sent === "rate_limited"
              ? "Un email vient déjà de partir vers cette adresse. Regardez votre boîte mail — et vos indésirables — avant d'en redemander un."
              : null
          );
          setStep({ name: "passwordSetup", email: normalizedEmail });
          return;
        }
        setLoginError(
          "L'envoi de l'email a échoué. Réessayez dans un instant, ou écrivez-nous si cela persiste."
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
        // We could not find out. Showing a password field here would be a
        // guess, and a wrong one for anyone whose space has no password: we
        // stay put and say what happened.
        setLoginError(
          "La vérification de votre adresse n'a pas abouti. Réessayez dans un instant, ou écrivez-nous si cela persiste."
        );
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
        // We already know the account exists and has a password, so the error
        // can only be the password itself. No need for the vaguer wording
        // Supabase would push us towards.
        throw new Error(
          "Mot de passe incorrect. Réessayez, ou utilisez « Mot de passe oublié ? » pour en choisir un nouveau."
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
      // signup profile insert failed): create one so the user can land on a
      // dashboard. Everything typed at signup or in the request form travels
      // in the account metadata, so we read it from there rather than start
      // from a blank row and make them type it all again.
      if (profileError && profileError.code === "PGRST116") {
        const meta = (authData.user.user_metadata ?? {}) as Record<string, string | undefined>;
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              first_name: meta.first_name ?? "",
              last_name: meta.last_name ?? "",
              phone: meta.phone ?? null,
              street_address: meta.street_address ?? null,
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
      setLoginError(error.message || "Mot de passe incorrect.");
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
      title: "S'authentifier",
      subtitle: "Indiquez votre adresse email pour continuer",
    },
    password: {
      title: "Votre mot de passe",
      subtitle: "Dernière étape avant votre espace",
    },
    noAccount: {
      title: "Aucun compte pour cette adresse",
      subtitle: "Créez votre compte, ou corrigez l'adresse",
    },
    passwordSetup: {
      title: "Votre compte n'est pas encore créé",
      subtitle: "Un email vient de partir pour le finaliser",
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
                  ? "Ce lien a expiré ou a déjà servi. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."
                  : "Ce lien n'est pas valide. Indiquez votre adresse ci-dessous pour en recevoir un nouveau."}
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

          {/* --- Step 1: the address, and nothing else. What it turns out to
              be is what decides between signing in and signing up, so this
              screen offers neither. --- */}
          {step.name === "email" && (
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  autoFocus
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
          )}

          {/* --- Step 2a: the password, on its own --- */}
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
            </>
          )}

          {/* --- Step 2b: no account --- */}
          {step.name === "noAccount" && (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  L&apos;adresse <span className="font-medium">{step.email}</span> n&apos;est
                  liée à aucun compte.
                </p>
              </div>
              <p className="text-sm text-gris-moyen">
                Soit vous avez utilisé une autre adresse, soit votre compte reste à créer.
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
                Modifier l&apos;adresse email
              </button>
            </div>
          )}

          {/* --- Step 2c: a space exists, but no account behind it yet --- */}
          {step.name === "passwordSetup" && (
            <div className="space-y-4">
              <div className="rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
                <p className="text-sm text-sauge-fonce">
                  L&apos;adresse <span className="font-medium">{step.email}</span> a bien un
                  espace chez nous, mais aucun mot de passe ne lui est associé : votre compte
                  n&apos;est donc pas encore créé.
                </p>
              </div>
              <p className="text-sm text-gris-moyen">
                Un email de création de compte vient de partir vers cette adresse. Le lien
                qu&apos;il contient vous permettra de choisir votre mot de passe, et votre
                compte sera créé.
              </p>
              {setupNotice && (
                <p className="text-sm text-gris-moyen border-l-2 border-sauge-clair pl-4">
                  {setupNotice}
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
                Modifier l&apos;adresse email
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
