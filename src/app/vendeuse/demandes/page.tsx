"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { RendezVous, StatutRendezVous, Disponibilite, Profile } from "@/types/database";
import {
  sendDemandeAccepteeNotification,
  sendDemandeRefuseeNotification,
} from "@/lib/email";

export default function VendeuseDemandesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [demandes, setDemandes] = useState<RendezVous[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          .eq("statut", "en_attente")
          .order("cree_le", { ascending: false });

        if (rdvError) {
          throw rdvError;
        }

        setDemandes(rdvData || []);

        // Fetch disponibilites for this vendeuse
        const { data: dispoData, error: dispoError } = await supabase
          .from("disponibilites")
          .select("*")
          .eq("user_id", user.id);

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

  const handleAcceptDemande = async (rdv: RendezVous) => {
    try {
      // Update rendez-vous statut to accepte
      const { error: rdvError } = await supabase
        .from("rendez_vous")
        .update({ statut: "accepte" as const, mis_a_jour_le: new Date().toISOString() })
        .eq("id", rdv.id);

      if (rdvError) {
        throw rdvError;
      }

      // Update disponibilite statut to reserve
      const { error: dispoError } = await supabase
        .from("disponibilites")
        .update({ statut: "reserve" as const })
        .eq("id", rdv.disponibilite_id);

      if (dispoError) {
        throw dispoError;
      }

      // Send notification to client
      const client = clients.find((c) => c.id === rdv.client_id);
      const dispo = disponibilites.find((d) => d.id === rdv.disponibilite_id);

      if (client && dispo) {
        await sendDemandeAccepteeNotification(
          client.email,
          `${client.prenom} ${client.nom}`,
          dispo.date,
          dispo.heure_debut
        );
      }

      toast({
        title: "Demande acceptée",
        description: "La demande de rendez-vous a été acceptée.",
      });

      // Refresh data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("vendeuse_id", user.id)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false });

      setDemandes(rdvData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleRefuseDemande = async (rdv: RendezVous) => {
    try {
      // Update rendez-vous statut to refuse
      const { error: rdvError } = await supabase
        .from("rendez_vous")
        .update({ statut: "refuse" as const, mis_a_jour_le: new Date().toISOString() })
        .eq("id", rdv.id);

      if (rdvError) {
        throw rdvError;
      }

      // Update disponibilite statut back to disponible
      const { error: dispoError } = await supabase
        .from("disponibilites")
        .update({ statut: "disponible" as const })
        .eq("id", rdv.disponibilite_id);

      if (dispoError) {
        throw dispoError;
      }

      // Send notification to client
      const client = clients.find((c) => c.id === rdv.client_id);
      const dispo = disponibilites.find((d) => d.id === rdv.disponibilite_id);

      if (client && dispo) {
        await sendDemandeRefuseeNotification(
          client.email,
          `${client.prenom} ${client.nom}`,
          dispo.date,
          dispo.heure_debut
        );
      }

      toast({
        title: "Demande refusée",
        description: "La demande de rendez-vous a été refusée.",
      });

      // Refresh data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("vendeuse_id", user.id)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false });

      setDemandes(rdvData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
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
        <div>
          <h1 className="text-3xl font-bold">Demandes de rendez-vous</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de rendez-vous de vos clients
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelles demandes</CardTitle>
            <CardDescription>
              {demandes.length} demande(s) en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demandes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune demande en attente.
              </p>
            ) : (
              <div className="space-y-4">
                {demandes.map((demande) => {
                  const dispoInfo = getDisponibiliteInfo(demande.disponibilite_id);

                  return (
                    <div
                      key={demande.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {getClientName(demande.client_id)}
                          </h3>
                          <Badge variant="default">En attente</Badge>
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
                          Demandé le: {format(new Date(demande.cree_le), "d MMMM yyyy à HH:mm", {
                            locale: "fr",
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptDemande(demande)}
                        >
                          Accepter
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRefuseDemande(demande)}
                        >
                          Refuser
                        </Button>
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
