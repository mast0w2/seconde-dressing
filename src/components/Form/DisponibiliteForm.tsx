"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar } from "../Calendar/Calendar";
import { cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const formSchema = z.object({
  date: z.date({
    required_error: "La date est requise",
  }),
  heure_debut: z.string().min(5, "L'heure de début est requise"),
  heure_fin: z.string().min(5, "L'heure de fin est requise"),
  est_recurrent: z.boolean().optional(),
  jour_recurrence: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DisponibiliteFormProps {
  onSuccess?: () => void;
  initialData?: {
    date: Date;
    heure_debut: string;
    heure_fin: string;
    est_recurrent: boolean;
    jour_recurrence: string;
  };
}

export function DisponibiliteForm({ onSuccess, initialData }: DisponibiliteFormProps) {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [date, setDate] = React.useState<Date>(initialData?.date || new Date());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      heure_debut: initialData?.heure_debut || "",
      heure_fin: initialData?.heure_fin || "",
      est_recurrent: initialData?.est_recurrent || false,
      jour_recurrence: initialData?.jour_recurrence || "",
    },
  });

  const { handleSubmit, register, setValue, watch, formState } = form;
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormValues) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour ajouter une disponibilité.",
          variant: "destructive",
        });
        return;
      }

      const formattedDate = format(data.date, "yyyy-MM-dd");

      const disponibiliteData = {
        user_id: user.id,
        date: formattedDate,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin,
        statut: "disponible" as const,
        est_recurrent: data.est_recurrent || false,
        jour_recurrence: data.jour_recurrence || null,
      };

      const { error } = await supabase
        .from("disponibilites")
        .insert([disponibiliteData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Disponibilité ajoutée",
        description: `Votre disponibilité pour le ${formattedDate} a été ajoutée.`,
      });

      onSuccess?.();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setValue("date", selectedDate);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Calendar
          date={date}
          onDateChange={setDate}
          onDateSelect={handleDateSelect}
          selectedDates={[date]}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="heure_debut">Heure de début</Label>
          <Input
            id="heure_debut"
            type="time"
            {...register("heure_debut")}
            className={cn(errors.heure_debut && "border-destructive")}
          />
          {errors.heure_debut && (
            <p className="text-sm text-destructive">{errors.heure_debut.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="heure_fin">Heure de fin</Label>
          <Input
            id="heure_fin"
            type="time"
            {...register("heure_fin")}
            className={cn(errors.heure_fin && "border-destructive")}
          />
          {errors.heure_fin && (
            <p className="text-sm text-destructive">{errors.heure_fin.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          id="est_recurrent"
          type="checkbox"
          {...register("est_recurrent")}
        />
        <Label htmlFor="est_recurrent">Récurrent</Label>
      </div>

      {watch("est_recurrent") && (
        <div className="space-y-2">
          <Label htmlFor="jour_recurrence">Jour de récurrence</Label>
          <Input
            id="jour_recurrence"
            {...register("jour_recurrence")}
            placeholder="Ex: Lundi"
          />
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement..." : "Ajouter la disponibilité"}
      </Button>
    </form>
  );
}
