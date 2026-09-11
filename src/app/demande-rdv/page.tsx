"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft } from "lucide-react";
import type { Profile, Formula } from "@/types/database";

const formSchema = z.object({
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  proposed_date: z.string().optional(),
  proposed_time: z.string().optional(),
  address: z.string().min(5, "L'adresse de collecte est requise"),
  formula_id: z.string().min(1, "Veuillez choisir une formule"),
  conditions_accepted: z
    .boolean()
    .refine((v) => v === true, "Vous devez accepter les critères de reprise"),
});

type FormValues = z.infer<typeof formSchema>;

export default function DemandeRdvPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      proposed_date: "",
      proposed_time: "",
      address: "",
      formula_id: "",
      conditions_accepted: false,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/signup");
        return;
      }
      setProfile(profileData as Profile);

      if (profileData.role !== "client") {
        router.push("/dashboard/vendeur");
        return;
      }

      const { data: formulasData, error: formulasError } = await supabase
        .from("formulas")
        .select("*")
        .order("price", { ascending: true });

      if (formulasError) throw formulasError;
      setFormulas((formulasData || []) as Formula[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le formulaire.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: FormValues) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("requests").insert([
        {
          client_id: user.id,
          request_type: "appointment",
          message: data.message,
          proposed_date: data.proposed_date || null,
          proposed_time: data.proposed_time || null,
          address: data.address,
          formula_id: data.formula_id,
          conditions_accepted: data.conditions_accepted,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Votre demande a bien été enregistrée.",
      });
      router.push("/dashboard/client");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Demande de rendez-vous</h1>
            <p className="text-muted-foreground">Décrivez votre besoin de reprise de vêtements</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Votre demande</CardTitle>
            <CardDescription>Renseignez les informations de collecte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse de collecte *</Label>
                <Input
                  id="address"
                  placeholder="12 rue du Commerce, 75001 Paris"
                  {...register("address")}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="formula_id">Formule de service *</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {formulas.map((formula) => (
                    <label
                      key={formula.id}
                      className={`flex flex-col gap-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch("formula_id") === formula.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        value={formula.id}
                        {...register("formula_id")}
                        className="sr-only"
                      />
                      <span className="font-medium">{formula.label}</span>
                      <span className="text-sm text-muted-foreground">{formula.price} €</span>
                    </label>
                  ))}
                </div>
                {errors.formula_id && (
                  <p className="text-sm text-destructive">{errors.formula_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposed_date">Date proposée (optionnel)</Label>
                  <Input id="proposed_date" type="date" {...register("proposed_date")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposed_time">Heure proposée (optionnel)</Label>
                  <Input id="proposed_time" type="time" {...register("proposed_time")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez vos pièces, marques, quantité..."
                  rows={4}
                  {...register("message")}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message.message}</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("conditions_accepted")}
                  className="mt-1"
                />
                <span className="text-sm">
                  Je confirme que mes pièces respectent les critères de reprise de Seconde
                </span>
              </label>
              {errors.conditions_accepted && (
                <p className="text-sm text-destructive">{errors.conditions_accepted.message}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer la demande"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
