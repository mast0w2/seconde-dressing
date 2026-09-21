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
import { getSupabaseClient } from "@/lib/supabase/client";

const formSchema = z.object({
  date: z.date({
    required_error: "La date est requise",
  }),
  start_time: z.string().min(5, "L'heure de début est requise"),
  end_time: z.string().min(5, "L'heure de fin est requise"),
  is_recurring: z.boolean().optional(),
  recurrence_day: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AvailabilityFormProps {
  onSuccess?: () => void;
  initialData?: {
    date: Date;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    recurrence_day: string;
  };
}

export function AvailabilityForm({ onSuccess, initialData }: AvailabilityFormProps) {
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [date, setDate] = React.useState<Date>(initialData?.date || new Date());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      start_time: initialData?.start_time || "",
      end_time: initialData?.end_time || "",
      is_recurring: initialData?.is_recurring || false,
      recurrence_day: initialData?.recurrence_day || "",
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

      const availabilityyData = {
        user_id: user.id,
        date: formattedDate,
        start_time: data.start_time,
        end_time: data.end_time,
        status: "available" as const,
        is_recurring: data.is_recurring || false,
        recurrence_day: data.recurrence_day || null,
      };

      const { error } = await supabase
        .from("availabilityies")
        .insert([availabilityyData]);

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
          <Label htmlFor="start_time">Heure de début</Label>
          <Input
            id="start_time"
            type="time"
            {...register("start_time")}
            className={cn(errors.start_time && "border-destructive")}
          />
          {errors.start_time && (
            <p className="text-sm text-destructive">{errors.start_time.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">Heure de fin</Label>
          <Input
            id="end_time"
            type="time"
            {...register("end_time")}
            className={cn(errors.end_time && "border-destructive")}
          />
          {errors.end_time && (
            <p className="text-sm text-destructive">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          id="is_recurring"
          type="checkbox"
          {...register("is_recurring")}
        />
        <Label htmlFor="is_recurring">Récurrent</Label>
      </div>

      {watch("is_recurring") && (
        <div className="space-y-2">
          <Label htmlFor="recurrence_day">Jour de récurrence</Label>
          <Input
            id="recurrence_day"
            {...register("recurrence_day")}
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
