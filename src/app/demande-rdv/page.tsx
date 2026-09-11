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
import { ArrowLeft, HelpCircle } from "lucide-react";
import type { Profile, Formula } from "@/types/database";
import { isProfileComplete } from "@/lib/profile";
import { getFormulaDetail } from "@/lib/formulas";
import { REPRISE_CRITERES } from "@/lib/reprise-criteria";

const formSchema = z.object({
  message: z.string().optional(),
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

      if (!isProfileComplete(profileData)) {
        router.push("/profile?incomplete=1");
        return;
      }

      const fullAddress = [profileData.street_address, profileData.postal_code, profileData.city]
        .filter(Boolean)
        .join(", ");
      if (fullAddress) {
        form.setValue("address", fullAddress);
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
          message: data.message || null,
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
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="formula_id">Formule de service *</Label>
                  <span className="group relative inline-flex">
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    <span className="absolute left-1/2 bottom-full z-10 mb-2 hidden -translate-x-1/2 group-hover:block w-64 rounded-md border border-noir/15 bg-blanc p-3 text-xs text-noir shadow-lg">
                      <strong className="block mb-1">Déjà trié (10 €) :</strong>
                      Vos vêtements sont déjà mis de côté, vous remplissez l'inventaire. On vient les récupérer.
                      <br /><br />
                      <strong className="block mb-1">Tri sur place (30 €) :</strong>
                      On passe 30 min à 1 h chez vous pour trier et repérer les pièces qui se revendront.
                      <br /><br />
                      <strong className="block mb-1">Tri & conseil (50 €) :</strong>
                      Rendez-vous d'1 h à 1 h 30 : on trie avec vous et on vous conseille.
                    </span>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {formulas.map((formula) => {
                    const detail = getFormulaDetail(formula.slug);
                    return (
                    <label
                      key={formula.id}
                      title={detail}
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
                      {detail && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{detail}</span>
                      )}
                    </label>
                    );
                  })}
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
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez vos pièces, marques, quantité..."
                  rows={4}
                  {...register("message")}
                />
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("conditions_accepted")}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    Je confirme que mes pièces respectent les{" "}
                    <span className="group relative inline-flex items-center">
                      <span className="underline underline-offset-2 cursor-help">critères de reprise</span>
                      <HelpCircle className="inline h-4 w-4 ml-0.5 text-muted-foreground cursor-help" />
                      <span className="absolute left-0 bottom-full z-10 mb-2 hidden group-hover:block w-72 rounded-md border border-noir/15 bg-blanc p-4 text-xs text-noir shadow-lg">
                        {REPRISE_CRITERES.map(({ icon: Icon, texte }) => (
                          <span key={texte} className="flex gap-2 mb-2 last:mb-0">
                            <Icon className="h-4 w-4 shrink-0 text-sauge mt-0.5" strokeWidth={1.3} />
                            <span>{texte}</span>
                          </span>
                        ))}
                      </span>
                    </span>{" "}
                    de Seconde
                  </span>
                </label>
              </div>
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
