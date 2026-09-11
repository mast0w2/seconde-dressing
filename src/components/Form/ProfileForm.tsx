"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Profile, Role } from "@/types/database";

const clientSchema = z.object({
  last_name: z.string().min(2, "Le nom est requis"),
  first_name: z.string().min(2, "Le prénom est requis"),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

const sellerSchema = z.object({
  last_name: z.string().min(2, "Le nom est requis"),
  first_name: z.string().min(2, "Le prénom est requis"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().min(2, "La spécialisation est requise"),
  hourly_rate: z.coerce.number().min(0, "Le tarif doit être positif"),
  years_experience: z.coerce.number().min(0, "L'expérience doit être positive"),
});

interface ProfileFormProps {
  profile?: Profile;
  role: Role;
  onSuccess?: () => void;
}

export function ProfileForm({ profile, role, onSuccess }: ProfileFormProps) {
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const schema = role === "seller" ? sellerSchema : clientSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      last_name: profile?.last_name || "",
      first_name: profile?.first_name || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      ...(role === "seller" && {
        specialization: profile?.specialization || "",
        hourly_rate: profile?.hourly_rate || 0,
        years_experience: profile?.years_experience || 0,
      }),
    } as any,
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

      const base = data as z.infer<typeof clientSchema>;
      const profileData: any = {
        id: user.id,
        last_name: base.last_name,
        first_name: base.first_name,
        email: user.email,
        phone: base.phone || null,
        bio: base.bio || null,
        role,
      };

      if (role === "seller" && "specialization" in data) {
        const sellerData = data as z.infer<typeof sellerSchema>;
        profileData.specialization = sellerData.specialization;
        profileData.hourly_rate = sellerData.hourly_rate;
        profileData.years_experience = sellerData.years_experience;
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
          <Label htmlFor="first_name">Prénom</Label>
          <Input
            id="first_name"
            {...register("first_name")}
            className={cn(errors.first_name && "border-destructive")}
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input
            id="last_name"
            {...register("last_name")}
            className={cn(errors.last_name && "border-destructive")}
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          className={cn(errors.phone && "border-destructive")}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
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

      {role === "seller" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="specialization">Spécialisation</Label>
            <Input
              id="specialization"
              {...register("specialization" as any)}
              className={cn((errors as any).specialization && "border-destructive")}
            />
            {(errors as any).specialization && (
              <p className="text-sm text-destructive">
                {(errors as any).specialization.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
              <Input
                id="hourly_rate"
                type="number"
                {...register("hourly_rate" as any)}
                className={cn((errors as any).hourly_rate && "border-destructive")}
              />
              {(errors as any).hourly_rate && (
                <p className="text-sm text-destructive">
                  {(errors as any).hourly_rate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Années d&apos;expérience</Label>
              <Input
                id="years_experience"
                type="number"
                {...register("years_experience" as any)}
                className={cn((errors as any).years_experience && "border-destructive")}
              />
              {(errors as any).years_experience && (
                <p className="text-sm text-destructive">
                  {(errors as any).years_experience.message}
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
