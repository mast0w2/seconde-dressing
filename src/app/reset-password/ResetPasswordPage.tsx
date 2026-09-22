"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const formSchema = z
  .object({
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmation"],
  });

type FormValues = z.infer<typeof formSchema>;

/**
 * Choosing a password, on arrival from a `recovery` link.
 *
 * Two paths lead here, and both have already opened a session by the time the
 * page renders:
 *  - /api/auth/password-setup then /api/auth/confirm, for a space that did not
 *    have a password yet (the login page flow);
 *  - /forgot-password, whose Supabase link drops its tokens in the URL
 *    fragment — the browser client consumes them on its own.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [state, setState] = useState<"checking" | "ready" | "noSession">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The Supabase link (/forgot-password) arrives with its tokens in the
    // fragment: createBrowserClient reads them on load, but not necessarily
    // before this first getUser(). onAuthStateChange catches that case.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session?.user) setState("ready");
    });

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      setState((previous) => (user || previous === "ready" ? "ready" : "noSession"));
    };

    check();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmation: "" },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const { data: updated, error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) throw updateError;

      const user = updated.user;
      let destination = "/profile?incomplete=1";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // Same completeness rule as everywhere else, so we do not send anyone
        // to a dashboard that would bounce straight back to /profile.
        if (profile && isProfileComplete(profile)) {
          destination = dashboardPathForRole(profile.role);
        }
      }

      toast({
        title: "Mot de passe enregistré",
        description:
          "Vous pourrez désormais vous connecter avec votre adresse et ce mot de passe.",
      });

      router.refresh();
      router.push(destination);
    } catch (caught: any) {
      console.error("Reset password error:", caught);
      setError(
        /different from the old password/i.test(caught?.message ?? "")
          ? "Ce mot de passe est déjà le vôtre. Choisissez-en un autre."
          : "L'enregistrement du mot de passe a échoué. Réessayez, ou demandez un nouveau lien depuis la page de connexion."
      );
    }
  };

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <p className="text-gris-moyen">Vérification du lien...</p>
      </div>
    );
  }

  if (state === "noSession") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Lien expiré</CardTitle>
            <CardDescription>
              Ce lien a déjà servi, ou il a plus d&apos;une heure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gris-moyen">
              Repartez de la page de connexion : indiquez votre adresse, nous vous en
              enverrons un nouveau.
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
          <CardTitle className="text-2xl">Choisissez votre mot de passe</CardTitle>
          <CardDescription>
            Il vous servira à vous connecter, sans repasser par un lien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password")}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmez le mot de passe</Label>
              <Input
                id="confirmation"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmation")}
                className={errors.confirmation ? "border-destructive" : ""}
              />
              {errors.confirmation && (
                <p className="text-sm text-destructive">{errors.confirmation.message}</p>
              )}
            </div>
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer mon mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
