"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Demande, StatutDemande, Profile } from "@/types/database";
import { Calendar, Clock, Mail, Phone, CheckCircle, XCircle, Package, Euro, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

// Status display configuration
const statutConfig: Record<StatutDemande, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: <Clock className="h-4 w-4" />,
  },
  acceptee: {
    label: "Acceptée",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  refusee: {
    label: "Refusée",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
  articles_recuperes: {
    label: "Articles récupérés",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: <Package className="h-4 w-4" />,
  },
  articles_en_vente: {
    label: "Articles en vente",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: <Euro className="h-4 w-4" />,
  },
  terminee: {
    label: "Terminée",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "en_attente" | "acceptee" | "refusee" | "en_cours" | "terminee">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!profile) {
          router.push("/signup");
          return;
        }

        // Only clients can access this page
        if (profile.role !== "client") {
          router.push("/dashboard");
          return;
        }

        setProfile(profile);

        // Fetch client's demandes
        const { data: demandesData, error } = await supabase
          .from("demandes")
          .select("*")
          .eq("client_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setDemandes(demandesData || []);
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
  }, [supabase, router, toast]);

  // Filter demandes based on active tab
  const filteredDemandes = demandes.filter((demande) => {
    if (activeTab === "all") return true;
    if (activeTab === "en_attente") return demande.statut === "en_attente";
    if (activeTab === "acceptee") return demande.statut === "acceptee";
    if (activeTab === "refusee") return demande.statut === "refusee";
    if (activeTab === "en_cours") 
      return ["articles_recuperes", "articles_en_vente"].includes(demande.statut);
    if (activeTab === "terminee") return demande.statut === "terminee";
    return true;
  });

  // Count demandes by status
  const counts = {
    all: demandes.length,
    en_attente: demandes.filter(d => d.statut === "en_attente").length,
    acceptee: demandes.filter(d => d.statut === "acceptee").length,
    refusee: demandes.filter(d => d.statut === "refusee").length,
    en_cours: demandes.filter(d => ["articles_recuperes", "articles_en_vente"].includes(d.statut)).length,
    terminee: demandes.filter(d => d.statut === "terminee").length,
  };

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
            <h1 className="text-3xl font-bold">Mon Tableau de Bord</h1>
            <p className="text-muted-foreground">
              Suivez l'état de vos demandes de rendez-vous
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "all" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.all}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "en_attente" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("en_attente")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.en_attente}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "acceptee" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("acceptee")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.acceptee}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "refusee" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("refusee")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.refusee}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "en_cours" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("en_cours")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.en_cours}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-shadow ${activeTab === "terminee" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab("terminee")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.terminee}</div>
            </CardContent>
          </Card>
        </div>

        {/* Demandes List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes demandes</CardTitle>
              <CardDescription>
                Suivez l'état de vos demandes de rendez-vous
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/demande-rdv">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {filteredDemandes.length === 0 ? (
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
                {filteredDemandes.map((demande) => {
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

                            {demande.message && (
                              <div className="mb-3 p-3 bg-muted/50 rounded">
                                <p className="text-sm">{demande.message}</p>
                              </div>
                            )}

                            <Badge className={statutInfo.color}>
                              {statutInfo.label}
                            </Badge>

                            {/* Show vendeur info if assigned */}
                            {demande.vendeur_id && (
                              <div className="mt-3 p-3 bg-muted/50 rounded">
                                <p className="text-sm font-medium">Vendeur assigné</p>
                                <p className="text-sm">
                                  Cette demande a été acceptée par un vendeur.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Status timeline */}
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="text-xs text-muted-foreground text-right">
                              {new Date(demande.created_at).toLocaleTimeString("fr-FR", { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </div>
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
      </div>
    </div>
  );
}
