"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/Calendar/Calendar";
import { DisponibiliteForm } from "@/components/Form/DisponibiliteForm";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Disponibilite, StatutDisponibilite } from "@/types/database";

export default function ClientDisponibilitesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDisponibilites = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("disponibilites")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });

        if (error) {
          throw error;
        }

        setDisponibilites(data || []);
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisponibilites();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => {
        await fetchDisponibilites();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, toast]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleDeleteDisponibilite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("disponibilites")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setDisponibilites(disponibilites.filter((d) => d.id !== id));
      toast({
        title: "Disponibilité supprimée",
        description: "La disponibilité a été supprimée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    // Refresh disponibilites
    const fetchDisponibilites = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("disponibilites")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!error) {
        setDisponibilites(data || []);
      }
    };
    fetchDisponibilites();
  };

  const getStatutColor = (statut: StatutDisponibilite) => {
    switch (statut) {
      case "disponible":
        return "bg-green-500";
      case "reserve":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutLabel = (statut: StatutDisponibilite) => {
    switch (statut) {
      case "disponible":
        return "Disponible";
      case "reserve":
        return "Réservé";
      default:
        return "Inconnu";
    }
  };

  const availableDates = disponibilites.map((d) => new Date(d.date));

  if (isLoading) {
    return (
      <div className="container py-8">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes disponibilités</h1>
            <p className="text-muted-foreground">
              Gérez vos créneaux de disponibilité
            </p>
          </div>

          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              Ajouter une disponibilité
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une disponibilité</CardTitle>
              <CardDescription>
                Sélectionnez une date et des horaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisponibiliteForm onSuccess={handleSuccess} />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
            <CardDescription>
              Sélectionnez une date pour ajouter une disponibilité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              date={selectedDate}
              onDateChange={setSelectedDate}
              onDateSelect={handleDateSelect}
              selectedDates={availableDates}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes disponibilités</CardTitle>
            <CardDescription>
              Liste de toutes vos disponibilités
            </CardDescription>
          </CardHeader>
          <CardContent>
            {disponibilites.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune disponibilité ajoutée. Commencez par en ajouter une !
              </p>
            ) : (
              <div className="space-y-4">
                {disponibilites.map((dispo) => (
                  <div
                    key={dispo.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {format(new Date(dispo.date), "EEEE d MMMM yyyy", {
                            locale: fr,
                          })}
                        </h3>
                        <Badge className={getStatutColor(dispo.statut)}>
                          {getStatutLabel(dispo.statut)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dispo.heure_debut} - {dispo.heure_fin}
                      </p>
                      {dispo.est_recurrent && (
                        <p className="text-sm text-muted-foreground">
                          Récurrent : {dispo.jour_recurrence}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Edit functionality
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDisponibilite(dispo.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
