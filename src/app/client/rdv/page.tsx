"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { RendezVous, StatutRendezVous } from "@/types/database";

export default function ClientRendezVousPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [vendeuses, setVendeuses] = useState<any[]>([]);
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedDisponibilite, setSelectedDisponibilite] = useState<any>(null);

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

        // Check if user is a client
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "client") {
          router.push("/");
          return;
        }

        // Fetch client's rendez-vous
        const { data: rdvData, error: rdvError } = await supabase
          .from("rendez_vous")
          .select("*")
          .eq("client_id", user.id)
          .order("cree_le", { ascending: false });

        if (rdvError) {
          throw rdvError;
        }

        setRendezVous(rdvData || []);

        // Fetch vendeuses
        const { data: vendeusesData, error: vendeusesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "vendeuse");

        if (vendeusesError) {
          throw vendeusesError;
        }

        setVendeuses(vendeusesData || []);

        // Fetch disponibilites for vendeuses
        const { data: dispoData, error: dispoError } = await supabase
          .from("disponibilites")
          .select("*")
          .eq("statut", "disponible");

        if (dispoError) {
          throw dispoError;
        }

        setDisponibilites(dispoData || []);
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

  const handleBookRendezVous = async (disponibilite: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      const { error } = await supabase.from("rendez_vous").insert([{
        client_id: user.id,
        vendeuse_id: disponibilite.user_id,
        disponibilite_id: disponibilite.id,
        statut: "en_attente" as const,
      }]);

      if (error) {
        throw error;
      }

      // Update disponibilite statut to reserve
      await supabase
        .from("disponibilites")
        .update({ statut: "reserve" as const })
        .eq("id", disponibilite.id);

      toast({
        title: "Rendez-vous demandé",
        description: "Votre demande de rendez-vous a été envoyée à la vendeuse.",
      });

      setShowBookForm(false);
      setSelectedDisponibilite(null);

      // Refresh data
      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("client_id", user.id)
        .order("cree_le", { ascending: false });

      setRendezVous(rdvData || []);

      const { data: dispoData } = await supabase
        .from("disponibilites")
        .select("*")
        .eq("statut", "disponible");

      setDisponibilites(dispoData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRendezVous = async (rdvId: string) => {
    try {
      const { error } = await supabase
        .from("rendez_vous")
        .update({ statut: "annule" as const })
        .eq("id", rdvId);

      if (error) {
        throw error;
      }

      // Update disponibilite statut back to disponible
      const { data: rdv } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("id", rdvId)
        .single();

      if (rdv) {
        await supabase
          .from("disponibilites")
          .update({ statut: "disponible" as const })
          .eq("id", rdv.disponibilite_id);
      }

      toast({
        title: "Rendez-vous annulé",
        description: "Votre rendez-vous a été annulé.",
      });

      // Refresh data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("client_id", user.id)
        .order("cree_le", { ascending: false });

      setRendezVous(rdvData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const getStatutColor = (statut: StatutRendezVous) => {
    switch (statut) {
      case "en_attente":
        return "bg-yellow-500";
      case "accepte":
        return "bg-green-500";
      case "refuse":
        return "bg-red-500";
      case "annule":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutLabel = (statut: StatutRendezVous) => {
    switch (statut) {
      case "en_attente":
        return "En attente";
      case "accepte":
        return "Accepté";
      case "refuse":
        return "Refusé";
      case "annule":
        return "Annulé";
      default:
        return "Inconnu";
    }
  };

  const getVendeuseName = (vendeuseId: string) => {
    const vendeuse = vendeuses.find((v) => v.id === vendeuseId);
    return vendeuse ? `${vendeuse.prenom} ${vendeuse.nom}` : "Vendeuse inconnue";
  };

  const getDisponibiliteInfo = (disponibiliteId: string) => {
    const dispo = disponibilites.find((d) => d.id === disponibiliteId);
    if (!dispo) return null;
    return {
      date: dispo.date,
      heure_debut: dispo.heure_debut,
      heure_fin: dispo.heure_fin,
    };
  };

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
            <h1 className="text-3xl font-bold">Mes rendez-vous</h1>
            <p className="text-muted-foreground">
              Gérez vos rendez-vous avec les vendeuses
            </p>
          </div>

          {!showBookForm && (
            <Button onClick={() => setShowBookForm(true)}>
              Prendre un rendez-vous
            </Button>
          )}
        </div>

        {showBookForm && (
          <Card>
            <CardHeader>
              <CardTitle>Prendre un rendez-vous</CardTitle>
              <CardDescription>
                Sélectionnez une vendeuse et un créneau disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Vendeuses disponibles</h3>
                {vendeuses.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucune vendeuse disponible.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {vendeuses.map((vendeuse) => {
                      const vendeuseDispos = disponibilites.filter(
                        (d) => d.user_id === vendeuse.id
                      );

                      return (
                        <div key={vendeuse.id} className="space-y-2">
                          <h4 className="font-medium">
                            {vendeuse.prenom} {vendeuse.nom}
                          </h4>
                          {vendeuse.specialisation && (
                            <p className="text-sm text-muted-foreground">
                              Spécialisation: {vendeuse.specialisation}
                            </p>
                          )}
                          {vendeuse.tarif_horaire && (
                            <p className="text-sm text-muted-foreground">
                              Tarif: {vendeuse.tarif_horaire}€/h
                            </p>
                          )}

                          {vendeuseDispos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {vendeuseDispos.map((dispo) => (
                                <Button
                                  key={dispo.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDisponibilite(dispo);
                                  }}
                                  className={cn(
                                    selectedDisponibilite?.id === dispo.id &&
                                      "bg-primary text-primary-foreground"
                                  )}
                                >
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs">
                                      {format(new Date(dispo.date), "d MMM", {
                                        locale: fr,
                                      })}
                                    </span>
                                    <span className="text-xs">
                                      {dispo.heure_debut} - {dispo.heure_fin}
                                    </span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Aucune disponibilité
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedDisponibilite && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Sélectionné:</h4>
                    <p>
                      {format(new Date(selectedDisponibilite.date), "EEEE d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                    <p>
                      {selectedDisponibilite.heure_debut} -{" "}
                      {selectedDisponibilite.heure_fin}
                    </p>
                    <p>
                      Avec: {getVendeuseName(selectedDisponibilite.user_id)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleBookRendezVous(selectedDisponibilite)}
                        disabled={!selectedDisponibilite}
                      >
                        Confirmer le rendez-vous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDisponibilite(null);
                          setShowBookForm(false);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {!selectedDisponibilite && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBookForm(false)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mes rendez-vous</CardTitle>
            <CardDescription>
              Liste de tous vos rendez-vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rendezVous.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun rendez-vous. Commencez par en prendre un !
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
                            {getVendeuseName(rdv.vendeuse_id)}
                          </h3>
                          <Badge className={getStatutColor(rdv.statut)}>
                            {getStatutLabel(rdv.statut)}
                          </Badge>
                        </div>
                        {dispoInfo && (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(dispoInfo.date), "EEEE d MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {dispoInfo.heure_debut} - {dispoInfo.heure_fin}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Créé le: {format(new Date(rdv.cree_le), "d MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {rdv.statut === "en_attente" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRendezVous(rdv.id)}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
