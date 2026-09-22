"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    try {
      // On ne vérifie plus l'existence du compte avant d'envoyer : cette
      // lecture de `profiles` en anonyme disait à qui le demandait quelles
      // adresses ont un compte chez nous, et c'était la dernière chose qui
      // obligeait à laisser la table lisible sans être connecté.
      // resetPasswordForEmail() n'envoie déjà rien pour une adresse inconnue.
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      // Écran dédié plutôt qu'un toast (qui disparaît) suivi d'une
      // redirection immédiate vers /login — c'était trop facile à manquer.
      setSentTo(data.email);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  if (sentTo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Vérifiez votre boîte mail</CardTitle>
            <CardDescription>Réinitialisez votre mot de passe depuis cet email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-sauge/50 bg-sauge-clair/30 p-4">
              <p className="text-sm text-sauge-fonce">
                Si un compte existe avec l&apos;adresse{" "}
                <span className="font-medium">{sentTo}</span>, un email de
                réinitialisation vient de partir. Cliquez sur le lien qu&apos;il
                contient pour choisir un nouveau mot de passe.
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
          <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gris-moyen">
            <Link href="/login" className="text-sauge-fonce hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
