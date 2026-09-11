"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Demande, StatutDemande, Profile } from "@/types/database";
import { Calendar, Clock, Mail, Phone, CheckCircle, XCircle, RefreshCw, Package, Euro, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Status display configuration
const statutConfig: Record<StatutDemande, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4" />,
  },
  acceptee: {
    label: "Acceptée",
    color: "bg-blue-100 text-blue-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  refusee: {
    label: "Refusée",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4" />,
  },
  articles_recuperes: {
    label: "Articles récupérés",
    color: "bg-purple-100 text-purple-800",
    icon: <Package className="h-4 w-4" />,
  },
  articles_en_vente: {
    label: "Articles en vente",
    color: "bg-orange-100 text-orange-800",
    icon: <Euro className="h-4 w-4" />,
  },
  terminee: {
    label: "Terminée",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

// Statuses a vendeur can set on a demande they accepted, in lifecycle order.
// The vendeur can pick any of them at any time, allowing them to revert.
const vendeurStatutOptions: StatutDemande[] = [
  "acceptee",
  "articles_recuperes",
  "articles_en_vente",
  "terminee",
];

type VendeurTab = "nouvelles" | "acceptees" | "refusees";
type ClientTab = "all" | "en_attente" | "acceptee" | "refusee" | "en_cours" | "terminee";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  // demande ids the current vendeur refused (still open for other vendeurs)
  const [refusedIds, setRefusedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [vendeurTab, setVendeurTab] = useState<VendeurTab>("nouvelles");
  const [clientTab, setClientTab] = useState<ClientTab>("all");

  const isVendeur = profile?.role === "vendeur";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!profileData) {
          router.push("/signup");
          return;
        }

        setProfile(profileData);

        if (profileData.role === "client") {
          await fetchClientDemandes(currentUser.id);
        } else if (profileData.role === "vendeur") {
          await fetchVendeurDemandes(currentUser.id);
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les demandes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, toast]);

  // Clients see only their own demandes
  const fetchClientDemandes = async (clientId: string) => {
    const { data, error } = await supabase
      .from("demandes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setDemandes(data || []);
  };

  // Vendeurs see: demandes they accepted (assigned to them, any status) +
  // open demandes (en_attente). Refusals are tracked per vendeur so a refused
  // demande stays open for others but is hidden from this vendeur's "nouvelles".
  const fetchVendeurDemandes = async (vendeurId: string) => {
    const [acceptedRes, openRes, refusRes] = await Promise.all([
      supabase
        .from("demandes")
        .select("*")
        .eq("vendeur_id", vendeurId)
        .order("created_at", { ascending: false }),
      supabase
        .from("demandes")
        .select("*")
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false }),
      supabase
        .from("demande_refus_vendeurs")
        .select("demande_id")
        .eq("vendeur_id", vendeurId),
    ]);

    if (acceptedRes.error) throw acceptedRes.error;
    if (openRes.error) throw openRes.error;
    if (refusRes.error) throw refusRes.error;

    const refused = new Set<string>((refusRes.data || []).map((r) => r.demande_id));
    setRefusedIds(refused);

    // Merge, dedupe by id, keep newest first
    const merged: Demande[] = [...(acceptedRes.data || []), ...(openRes.data || [])];
    const seen = new Set<string>();
    const unique = merged.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
    setDemandes(unique);
  };

  // Vendeur accepts a demande: it becomes theirs and leaves the open pool for
  // everyone else. The first vendeur to accept wins.
  const handleAcceptDemande = async (demandeId: string) => {
    try {
      const { error } = await supabase
        .from("demandes")
        .update({
          statut: "acceptee",
          vendeur_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", demandeId)
        .eq("vendeur_id", null)
        .eq("statut", "en_attente");

      if (error) throw error;

      await fetchVendeurDemandes(user.id);

      toast({
        title: "Demande acceptée",
        description: "Vous avez accepté cette demande. Le client a été notifié.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Vendeur refuses a demande: the global status is NOT changed, so another
  // vendeur can still accept it. We only record the refusal for this vendeur.
  const handleRefuseDemande = async (demandeId: string) => {
    try {
      const { error } = await supabase
        .from("demande_refus_vendeurs")
        .upsert(
          { demande_id: demandeId, vendeur_id: user.id },
          { onConflict: "demande_id,vendeur_id" }
        );

      if (error) throw error;

      await fetchVendeurDemandes(user.id);

      toast({
        title: "Demande refusée",
        description: "Cette demande reste disponible pour les autres vendeurs.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Update the status of a demande the vendeur accepted. Works for any of the
  // post-acceptance statuses, so the vendeur can move forward or revert.
  const handleUpdateStatut = async (demandeId: string, newStatut: StatutDemande) => {
    try {
      const { error } = await supabase
        .from("demandes")
        .update({
          statut: newStatut,
          updated_at: new Date().toISOString(),
        })
        .eq("id", demandeId)
        .eq("vendeur_id", user.id);

      if (error) throw error;

      if (isVendeur) {
        await fetchVendeurDemandes(user.id);
      } else {
        await fetchClientDemandes(user.id);
      }

      toast({
        title: "Statut mis à jour",
        description: `La demande a été passée en "${statutConfig[newStatut].label}".`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // ---- Vendeur view: split demandes into the three tabs ----
  const vendeurBuckets = useMemo(() => {
    const nouvelles: Demande[] = [];
    const acceptees: Demande[] = [];
    const refusees: Demande[] = [];

    for (const demande of demandes) {
      const isAssignedToMe = demande.vendeur_id === user?.id;
      if (isAssignedToMe) {
        acceptees.push(demande);
      } else if (refusedIds.has(demande.id)) {
        refusees.push(demande);
      } else {
        nouvelles.push(demande);
      }
    }
    return { nouvelles, acceptees, refusees };
  }, [demandes, refusedIds, user]);

  // ---- Client view: filter by active tab ----
  const filteredClientDemandes = useMemo(() => {
    return demandes.filter((demande) => {
      switch (clientTab) {
        case "all":
          return true;
        case "en_attente":
          return demande.statut === "en_attente";
        case "acceptee":
          return demande.statut === "acceptee";
        case "refusee":
          return demande.statut === "refusee";
        case "en_cours":
          return ["articles_recuperes", "articles_en_vente"].includes(demande.statut);
        case "terminee":
          return demande.statut === "terminee";
        default:
          return true;
      }
    });
  }, [demandes, clientTab]);

  const clientCounts = useMemo(
    () => ({
      all: demandes.length,
      en_attente: demandes.filter((d) => d.statut === "en_attente").length,
      acceptee: demandes.filter((d) => d.statut === "acceptee").length,
      refusee: demandes.filter((d) => d.statut === "refusee").length,
      en_cours: demandes.filter((d) => ["articles_recuperes", "articles_en_vente"].includes(d.statut)).length,
      terminee: demandes.filter((d) => d.statut === "terminee").length,
    }),
    [demandes]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">
              {profile.role === "client"
                ? "Suivez l'état de vos demandes de rendez-vous"
                : "Gérez les demandes des clients"}
            </p>
          </div>
        </div>

        {isVendeur ? (
          <VendeurDashboard
            buckets={vendeurBuckets}
            activeTab={vendeurTab}
            onTabChange={setVendeurTab}
            onAccept={handleAcceptDemande}
            onRefuse={handleRefuseDemande}
            onUpdateStatut={handleUpdateStatut}
          />
        ) : (
          <ClientDashboard
            demandes={filteredClientDemandes}
            counts={clientCounts}
            activeTab={clientTab}
            onTabChange={setClientTab}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Vendeur dashboard: 3 tabs (Nouvelles / Acceptées / Refusées)
// ============================================================================

interface VendeurDashboardProps {
  buckets: { nouvelles: Demande[]; acceptees: Demande[]; refusees: Demande[] };
  activeTab: VendeurTab;
  onTabChange: (tab: VendeurTab) => void;
  onAccept: (demandeId: string) => void;
  onRefuse: (demandeId: string) => void;
  onUpdateStatut: (demandeId: string, statut: StatutDemande) => void;
}

function VendeurDashboard({
  buckets,
  activeTab,
  onTabChange,
  onAccept,
  onRefuse,
  onUpdateStatut,
}: VendeurDashboardProps) {
  const tabs: { key: VendeurTab; label: string; count: number }[] = [
    { key: "nouvelles", label: "Nouvelles demandes", count: buckets.nouvelles.length },
    { key: "acceptees", label: "Demandes acceptées", count: buckets.acceptees.length },
    { key: "refusees", label: "Demandes refusées", count: buckets.refusees.length },
  ];

  const activeDemandes =
    activeTab === "nouvelles"
      ? buckets.nouvelles
      : activeTab === "acceptees"
      ? buckets.acceptees
      : buckets.refusees;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Card
            key={tab.key}
            className={`cursor-pointer transition-shadow ${activeTab === tab.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tab.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tab.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demandes List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tabs.find((t) => t.key === activeTab)?.label}
          </CardTitle>
          <CardDescription>
            {activeTab === "nouvelles" &&
              "Acceptez ou refusez les demandes entrantes. Une demande refusée reste disponible pour les autres vendeurs."}
            {activeTab === "acceptees" &&
              "Vous gérez le statut des demandes que vous avez acceptées. Utilisez le menu déroulant pour avancer ou revenir en arrière."}
            {activeTab === "refusees" &&
              "Demandes que vous avez refusées. Elles restent ouvertes pour les autres vendeurs tant qu’elles ne sont pas acceptées."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeDemandes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune demande dans cette catégorie.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDemandes.map((demande) => (
                <VendeurDemandeCard
                  key={demande.id}
                  demande={demande}
                  tab={activeTab}
                  onAccept={onAccept}
                  onRefuse={onRefuse}
                  onUpdateStatut={onUpdateStatut}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

interface VendeurDemandeCardProps {
  demande: Demande;
  tab: VendeurTab;
  onAccept: (demandeId: string) => void;
  onRefuse: (demandeId: string) => void;
  onUpdateStatut: (demandeId: string, statut: StatutDemande) => void;
}

function VendeurDemandeCard({
  demande,
  tab,
  onAccept,
  onRefuse,
  onUpdateStatut,
}: VendeurDemandeCardProps) {
  const statutInfo = statutConfig[demande.statut];

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${statutInfo.color}`}>
                {statutInfo.icon}
              </div>
              <div>
                <div className="font-semibold">
                  Demande #{demande.id.slice(0, 8)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(demande.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {demande.client_prenom} {demande.client_nom}
            </div>

            <div className="text-sm text-muted-foreground mb-3">
              {demande.client_email}
            </div>

            <Badge className={statutInfo.color}>
              {statutInfo.label}
            </Badge>

            {demande.message && (
              <div className="mt-3 p-3 bg-muted/50 rounded">
                <p className="text-sm">{demande.message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4 min-w-[180px]">
            {tab === "nouvelles" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onAccept(demande.id)}
                  className="h-8 px-3"
                >
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRefuse(demande.id)}
                  className="h-8 px-3"
                >
                  Refuser
                </Button>
              </>
            )}

            {tab === "acceptees" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground mb-1">
                  Statut de la commande
                </label>
                <Select
                  value={demande.statut}
                  onChange={(e) => onUpdateStatut(demande.id, e.target.value as StatutDemande)}
                  className="h-9"
                >
                  {vendeurStatutOptions.map((statut) => (
                    <option key={statut} value={statut}>
                      {statutConfig[statut].label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {tab === "refusees" && (
              <div className="text-xs text-muted-foreground italic">
                Disponible pour les autres vendeurs
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Client dashboard: existing multi-status view
// ============================================================================

interface ClientDashboardProps {
  demandes: Demande[];
  counts: Record<string, number>;
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
}

function ClientDashboard({
  demandes,
  counts,
  activeTab,
  onTabChange,
}: ClientDashboardProps) {
  const tabs: { key: ClientTab; label: string; count: number }[] = [
    { key: "all", label: "Total", count: counts.all },
    { key: "en_attente", label: "En attente", count: counts.en_attente },
    { key: "acceptee", label: "Acceptées", count: counts.acceptee },
    { key: "refusee", label: "Refusées", count: counts.refusee },
    { key: "en_cours", label: "En cours", count: counts.en_cours },
    { key: "terminee", label: "Terminées", count: counts.terminee },
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tabs.map((tab) => (
          <Card
            key={tab.key}
            className={`cursor-pointer transition-shadow ${activeTab === tab.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tab.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tab.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demandes List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes demandes</CardTitle>
          <CardDescription>
            Suivez l&apos;état de vos demandes de rendez-vous
          </CardDescription>
        </CardHeader>

        <CardContent>
          {demandes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">Aucune demande trouvée.</p>
              <Button asChild>
                <Link href="/demande-rdv">
                  Faire une nouvelle demande
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {demandes.map((demande) => {
                const statutInfo = statutConfig[demande.statut];
                return (
                  <Card key={demande.id} className="border-0 shadow-none">
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${statutInfo.color}`}>
                              {statutInfo.icon}
                            </div>
                            <div>
                              <div className="font-semibold">
                                Demande #{demande.id.slice(0, 8)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(demande.created_at).toLocaleDateString("fr-FR")}
                              </div>
                            </div>
                          </div>

                          <Badge className={statutInfo.color}>
                            {statutInfo.label}
                          </Badge>

                          {demande.message && (
                            <div className="mt-3 p-3 bg-muted/50 rounded">
                              <p className="text-sm">{demande.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
