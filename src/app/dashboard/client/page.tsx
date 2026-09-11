"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import type { Request, Profile, Formula, RequestStatus } from "@/types/database";
import {
  requestStatusConfig,
  RequestFilterTab,
  IN_PROGRESS_STATUSES,
} from "@/lib/request-status";
import { isProfileComplete } from "@/lib/profile";
import { ArrowLeft } from "lucide-react";

interface RequestWithRelations extends Request {
  seller: Profile | null;
  formula: Formula | null;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RequestFilterTab>("all");

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/signup");
        return;
      }
      setProfile(profileData as Profile);

      if (profileData.role !== "client") {
        router.push("/dashboard/vendeur");
        return;
      }

      if (!isProfileComplete(profileData)) {
        router.push("/profile?incomplete=1");
        return;
      }

      const { data: requestsData, error } = await supabase
        .from("requests")
        .select(`
          *,
          seller:seller_id (id, first_name, last_name),
          formula:formula_id (id, slug, label, price)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setRequests((requestsData || []) as unknown as RequestWithRelations[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les demandes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "all") return true;
    if (activeTab === "in_progress") return IN_PROGRESS_STATUSES.includes(request.status);
    return request.status === (activeTab as RequestStatus);
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    refused: requests.filter((r) => r.status === "refused").length,
    in_progress: requests.filter((r) => IN_PROGRESS_STATUSES.includes(r.status)).length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const statsCards: { key: RequestFilterTab; label: string; value: number }[] = [
    { key: "all", label: "Total", value: counts.all },
    { key: "pending", label: "En attente", value: counts.pending },
    { key: "accepted", label: "Acceptées", value: counts.accepted },
    { key: "refused", label: "Refusées", value: counts.refused },
    { key: "in_progress", label: "En cours", value: counts.in_progress },
    { key: "completed", label: "Terminées", value: counts.completed },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Suivez l'état de vos demandes de rendez-vous</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsCards.map((card) => (
            <Card
              key={card.key}
              className={`cursor-pointer transition-shadow ${activeTab === card.key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActiveTab(card.key)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mes demandes</CardTitle>
            <CardDescription>Suivez l'état de vos demandes de rendez-vous</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">Aucune demande trouvée.</p>
                <Button asChild>
                  <Link href="/demande-rdv">Faire une nouvelle demande</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const statusInfo = requestStatusConfig[request.status];
                  const seller = request.seller;
                  const formula = request.formula;
                  return (
                    <Card key={request.id} className="border-0 shadow-none">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                                {statusInfo.icon}
                              </div>
                              <div>
                                <div className="font-semibold">
                                  Demande #{request.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>

                            {seller && (
                              <div className="text-sm text-muted-foreground mb-2">
                                Vendeuse : {seller.first_name} {seller.last_name}
                              </div>
                            )}

                            {formula && (
                              <div className="text-sm text-muted-foreground mb-3">
                                Formule : {formula.label} ({formula.price} €)
                              </div>
                            )}

                            {request.address && (
                              <div className="text-sm text-muted-foreground mb-3">
                                Adresse : {request.address}
                              </div>
                            )}

                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>

                            {request.message && (
                              <div className="mt-3 p-3 bg-muted/50 rounded">
                                <p className="text-sm">{request.message}</p>
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
      </div>
    </div>
  );
}
