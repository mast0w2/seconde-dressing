"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Profile, Role } from "@/types/database";

const clientSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().optional(),
  bio: z.string().optional(),
});

const vendeurSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().optional(),
  bio: z.string().optional(),
  specialisation: z.string().min(2, "La spécialisation est requise"),
  tarif_horaire: z.coerce.number().min(0, "Le tarif doit être positif"),
  annees_experience: z.coerce.number().min(0, "L'expérience doit être positive"),
});

interface ProfileFormProps {
  profile?: Profile;
  role: Role;
  onSuccess?: () => void;
}

export function ProfileForm({ profile, role, onSuccess }: ProfileFormProps) {
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const schema = role === "vendeur" ? vendeurSchema : clientSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: profile?.nom || "",
      prenom: profile?.prenom || "",
      telephone: profile?.telephone || "",
      bio: profile?.bio || "",
      ...(role === "vendeur" && {
        specialisation: profile?.specialisation || "",
        tarif_horaire: profile?.tarif_horaire || 0,
        annees_experience: profile?.annees_experience || 0,
      }),
    },
  });

  const { handleSubmit, register, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour modifier votre profil.",
          variant: "destructive",
        });
        return;
      }

      const profileData: any = {
        id: user.id,
        nom: data.nom,
        prenom: data.prenom,
        email: user.email,
        telephone: data.telephone || null,
        bio: data.bio || null,
        role,
      };

      if (role === "vendeur" && "specialisation" in data) {
        const vendeurData = data as z.infer<typeof vendeurSchema>;
        profileData.specialisation = vendeurData.specialisation;
        profileData.tarif_horaire = vendeurData.tarif_horaire;
        profileData.annees_experience = vendeurData.annees_experience;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert([profileData], { onConflict: "id" });

      if (error) {
        throw error;
      }

      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été mis à jour avec succès.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            {...register("prenom")}
            className={cn(errors.prenom && "border-destructive")}
          />
          {errors.prenom && (
            <p className="text-sm text-destructive">{errors.prenom.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            {...register("nom")}
            className={cn(errors.nom && "border-destructive")}
          />
          {errors.nom && (
            <p className="text-sm text-destructive">{errors.nom.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          type="tel"
          {...register("telephone")}
          className={cn(errors.telephone && "border-destructive")}
        />
        {errors.telephone && (
          <p className="text-sm text-destructive">{errors.telephone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          className={cn(errors.bio && "border-destructive")}
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      {role === "vendeur" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="specialisation">Spécialisation</Label>
            <Input
              id="specialisation"
              {...register("specialisation" as any)}
              className={cn((errors as any).specialisation && "border-destructive")}
            />
            {(errors as any).specialisation && (
              <p className="text-sm text-destructive">
                {(errors as any).specialisation.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tarif_horaire">Tarif horaire (€)</Label>
              <Input
                id="tarif_horaire"
                type="number"
                {...register("tarif_horaire" as any)}
                className={cn((errors as any).tarif_horaire && "border-destructive")}
              />
              {(errors as any).tarif_horaire && (
                <p className="text-sm text-destructive">
                  {(errors as any).tarif_horaire.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annees_experience">Années d&apos;expérience</Label>
              <Input
                id="annees_experience"
                type="number"
                {...register("annees_experience" as any)}
                className={cn((errors as any).annees_experience && "border-destructive")}
              />
              {(errors as any).annees_experience && (
                <p className="text-sm text-destructive">
                  {(errors as any).annees_experience.message}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
