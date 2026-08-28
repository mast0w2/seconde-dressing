"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/Calendar/Calendar";
import { DisponibiliteForm } from "@/components/Form/DisponibiliteForm";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { RendezVous, Disponibilite, StatutRendezVous, Profile } from "@/types/database";

export default function VendeuseAgendaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user is a vendeuse
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "vendeuse") {
          router.push("/");
          return;
        }

        // Fetch rendez-vous for this vendeuse
        const { data: rdvData, error: rdvError } = await supabase
          .from("rendez_vous")
          .select("*")
          .eq("vendeuse_id", user.id)
          .order("cree_le", { ascending: false });

        if (rdvError) {
          throw rdvError;
        }

        setRendezVous(rdvData || []);

        // Fetch disponibilites for this vendeuse
        const { data: dispoData, error: dispoError } = await supabase
          .from("disponibilites")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });

        if (dispoError) {
          throw dispoError;
        }

        setDisponibilites(dispoData || []);

        // Fetch client profiles
        const clientIds = [...new Set(rdvData?.map((rdv) => rdv.client_id) || [])];
        if (clientIds.length > 0) {
          const { data: clientsData, error: clientsError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", clientIds);

          if (clientsError) {
            throw clientsError;
          }

          setClients(clientsData || []);
        }
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

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async () => {
        await fetchData();
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

  const handleSuccess = () => {
    setShowForm(false);
    // Refresh disponibilites
    const fetchDisponibilites = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dispoData } = await supabase
        .from("disponibilites")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      setDisponibilites(dispoData || []);
    };
    fetchDisponibilites();
  };

  const handleDeleteDisponibilite = async (id: string) => {
    try {
      // Check if disponibilite has a rendez-vous
      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("disponibilite_id", id)
        .single();

      if (rdvData) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer une disponibilité avec un rendez-vous.",
          variant: "destructive",
        });
        return;
      }

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

  const getStatutColor = (statut: StatutRendezVous | "disponible" | "reserve") => {
    switch (statut) {
      case "en_attente":
        return "bg-yellow-500";
      case "accepte":
        return "bg-green-500";
      case "refuse":
        return "bg-red-500";
      case "annule":
        return "bg-gray-500";
      case "disponible":
        return "bg-green-500";
      case "reserve":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutLabel = (statut: StatutRendezVous | "disponible" | "reserve") => {
    switch (statut) {
      case "en_attente":
        return "En attente";
      case "accepte":
        return "Accepté";
      case "refuse":
        return "Refusé";
      case "annule":
        return "Annulé";
      case "disponible":
        return "Disponible";
      case "reserve":
        return "Réservé";
      default:
        return "Inconnu";
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
  };

  const getDisponibiliteInfo = (disponibiliteId: string) => {
    const dispo = disponibilites.find((d) => d.id === disponibiliteId);
    if (!dispo) return null;
    return {
      date: dispo.date,
      heure_debut: dispo.heure_debut,
      heure_fin: dispo.heure_fin,
      statut: dispo.statut,
    };
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
            <h1 className="text-3xl font-bold">Mon agenda</h1>
            <p className="text-muted-foreground">
              Gérez vos disponibilités et rendez-vous
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              onClick={() => setView("calendar")}
            >
              Calendrier
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setView("list")}
            >
              Liste
            </Button>
          </div>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Ajouter une disponibilité
          </Button>
        )}

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

        {view === "calendar" && (
          <Card>
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
              <CardDescription>
                Visualisez vos disponibilités et rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                date={selectedDate}
                onDateChange={setSelectedDate}
                onDateSelect={handleDateSelect}
                selectedDates={availableDates}
              />

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Légende</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-500" />
                    <span className="text-sm">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-orange-500" />
                    <span className="text-sm">Réservé</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {view === "calendar" ? "Disponibilités" : "Tous les rendez-vous"}
            </CardTitle>
            <CardDescription>
              {view === "calendar"
                ? "Liste de toutes vos disponibilités"
                : "Liste de tous vos rendez-vous"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === "calendar" ? (
              <>
                {disponibilites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune disponibilité ajoutée. Commencez par en ajouter une !
                  </p>
                ) : (
                  <div className="space-y-4">
                    {disponibilites.map((dispo) => {
                      const rdv = rendezVous.find(
                        (r) => r.disponibilite_id === dispo.id
                      );

                      return (
                        <div
                          key={dispo.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {format(new Date(dispo.date), "EEEE d MMMM yyyy", {
                                  locale: "fr",
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
                            {rdv && (
                              <p className="text-sm text-muted-foreground">
                                Avec: {getClientName(rdv.client_id)}
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
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {rendezVous.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun rendez-vous.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rendezVous.map((rdv) => {
                      const dispoInfo = getDisponibiliteInfo(rdv.disponibilite_id);

                      return (
                        <div
                          key={rdv.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {getClientName(rdv.client_id)}
                              </h3>
                              <Badge className={getStatutColor(rdv.statut)}>
                                {getStatutLabel(rdv.statut)}
                              </Badge>
                            </div>
                            {dispoInfo && (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(dispoInfo.date), "EEEE d MMMM yyyy", {
                                    locale: "fr",
                                  })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {dispoInfo.heure_debut} - {dispoInfo.heure_fin}
                                </p>
                              </>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Créé le: {format(new Date(rdv.cree_le), "d MMMM yyyy à HH:mm", {
                                locale: "fr",
                              })}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {rdv.statut === "en_attente" && (
                              <>
                                <Button size="sm">Accepter</Button>
                                <Button variant="destructive" size="sm">
                                  Refuser
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
