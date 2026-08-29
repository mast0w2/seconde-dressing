"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";
import { RendezVous, StatutRendezVous, Disponibilite, Profile } from "@/types/database";

export default function VendeuseDemandesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [demandes, setDemandes] = useState<RendezVous[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch disponibilites
        const { data: dispoData } = await supabase
          .from("disponibilites")
          .select("*")
          .eq("user_id", user.id);
        setDisponibilites(dispoData || []);

        // Fetch clients
        const { data: clientsData } = await supabase.from("profiles").select("*").eq("role", "client");
        setClients(clientsData || []);

        // Fetch demandes de rendez-vous pour cette vendeuse
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, router, toast]);

  const handleAccepter = async (rdv: RendezVous) => {
    try {
      // Update rendez-vous status
      const { error } = await supabase
        .from("rendez_vous")
        .update({ statut: "confirme" })
        .eq("id", rdv.id);

      if (error) throw error;

      // Get client and vendeuse info for notification
      const client = clients.find((c) => c.id === rdv.client_id);
      const vendeuse = await (await supabase
        .from("profiles")
        .select("*")
        .eq("id", rdv.vendeuse_id)
        .single()).data;

      // Send notification to client
      if (client?.email) {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'demande_acceptee',
            clientEmail: client.email,
            vendeuseNom: vendeuse?.prenom || 'une vendeuse',
            date: rdv.date,
            heure: rdv.heure_debut,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send notification');
        }
      }

      // Refresh data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("vendeuse_id", user.id)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false });

      setDemandes(rdvData || []);

      toast({
        title: "Demande acceptée",
        description: "La demande de rendez-vous a été acceptée. Un email a été envoyé au client.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleRefuser = async (rdv: RendezVous) => {
    try {
      // Update rendez-vous status
      const { error } = await supabase
        .from("rendez_vous")
        .update({ statut: "annule" })
        .eq("id", rdv.id);

      if (error) throw error;

      // Get client info for notification
      const client = clients.find((c) => c.id === rdv.client_id);
      const vendeuse = await (await supabase
        .from("profiles")
        .select("*")
        .eq("id", rdv.vendeuse_id)
        .single()).data;

      // Send notification to client
      if (client?.email) {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'demande_refusee',
            clientEmail: client.email,
            vendeuseNom: vendeuse?.prenom || 'une vendeuse',
            date: rdv.date,
            heure: rdv.heure_debut,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send notification');
        }
      }

      // Refresh data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rdvData } = await supabase
        .from("rendez_vous")
        .select("*")
        .eq("vendeuse_id", user.id)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false });

      setDemandes(rdvData || []);

      toast({
        title: "Demande refusée",
        description: "La demande de rendez-vous a été refusée. Un email a été envoyé au client.",
      });
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

  const getDisponibiliteInfo = (dispoId: string) => {
    const dispo = disponibilites.find((d) => d.id === dispoId);
    return dispo ? { date: dispo.date, heure: dispo.heure_debut } : { date: "", heure: "" };
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "confirme":
        return <Badge variant="default">Confirmé</Badge>;
      case "annule":
        return <Badge variant="destructive">Annulé</Badge>;
      case "en_attente":
        return <Badge variant="secondary">En attente</Badge>;
      case "termine":
        return <Badge variant="outline">Terminé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Chargement des demandes...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Demandes de rendez-vous</h1>
        </div>

        {demandes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Aucune demande de rendez-vous en attente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {demandes.map((rdv) => {
              const clientName = getClientName(rdv.client_id);
              const dispoInfo = getDisponibiliteInfo(rdv.disponibilite_id);

              return (
                <Card key={rdv.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Demande de {clientName}</span>
                      {getStatusBadge(rdv.statut)}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(rdv.cree_le), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Date:</span>
                        <span>{dispoInfo.date ? new Date(dispoInfo.date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Heure:</span>
                        <span>{dispoInfo.heure || 'N/A'}</span>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button size="sm" onClick={() => handleAccepter(rdv)}>
                          Accepter
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRefuser(rdv)}>
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// French locale for date-fns
import { fr } from 'date-fns/locale';
