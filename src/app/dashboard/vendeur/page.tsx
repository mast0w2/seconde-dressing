"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { isProfileComplete } from "@/lib/profile";
import type { Request, Profile, Formula, RequestStatus } from "@/types/database";
import {
  requestStatusConfig,
  RequestFilterTab,
  IN_PROGRESS_STATUSES,
  NEXT_STATUS,
  NEXT_STATUS_LABEL,
} from "@/lib/request-status";
import { ArrowLeft } from "lucide-react";
import { RequestItemsUploader } from "@/components/RequestItemsUploader";

interface RequestWithRelations extends Request {
  client: Profile | null;
  formula: Formula | null;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RequestFilterTab>("all");

  const fetchRequests = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        client:client_id (id, first_name, last_name, email, phone),
        formula:formula_id (id, slug, label, price)
      `)
      .or(`and(client_id.not.is.null,seller_id.is.null),seller_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    setRequests((data || []) as unknown as RequestWithRelations[]);
  }, [supabase]);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
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
      setProfile(profileData as Profile);

      if (profileData.role !== "seller") {
        router.push("/dashboard/client");
        return;
      }

      if (!isProfileComplete(profileData)) {
        router.push("/profile?incomplete=1");
        return;
      }

      await fetchRequests(currentUser.id);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les demandes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, toast, fetchRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: "accepted",
          seller_id: user.id,
          confirmed_date: new Date().toISOString().slice(0, 10),
          confirmed_time: new Date().toTimeString().slice(0, 8),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      await fetchRequests(user.id);
      toast({ title: "Demande acceptée", description: "Le client a été notifié." });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleRefuse = async (requestId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: "refused",
          seller_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      await fetchRequests(user.id);
      toast({ title: "Demande refusée", description: "Vous avez refusé cette demande." });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleAdvanceStatus = async (requestId: string) => {
    if (!user) return;
    const current = requests.find((r) => r.id === requestId);
    if (!current) return;
    const next = NEXT_STATUS[current.status];
    if (!next) return;

    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      await fetchRequests(user.id);
      toast({ title: "Statut mis à jour", description: `La demande est passée en "${requestStatusConfig[next].label}".` });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

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

  if (!user || !profile) return null;

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl">Tableau de bord</h1>
            <p className="text-gris-moyen">Gérez les demandes des clients</p>
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
            <CardTitle>Demandes des clients</CardTitle>
            <CardDescription>
              Acceptez ou refusez les demandes, et gérez le processus de vente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gris-moyen">
                <p>Aucune demande trouvée.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const statusInfo = requestStatusConfig[request.status];
                  const client = request.client;
                  const formula = request.formula;
                  const isAssignedToMe = request.seller_id === user.id;
                  const canAccept = !request.seller_id;
                  const canRefuse = !request.seller_id;
                  const canAdvance = isAssignedToMe && NEXT_STATUS[request.status];
                  const clientDisplayName = client
                    ? `${client.first_name} ${client.last_name}`.trim()
                    : `${request.client_first_name ?? ""} ${request.client_last_name ?? ""}`.trim();
                  const clientEmail = client?.email ?? request.client_email ?? null;
                  const clientPhone = client?.phone ?? request.client_phone ?? null;

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
                                <div className="text-sm text-gris-moyen">
                                  {new Date(request.created_at).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>

                            {clientDisplayName && (
                              <div className="text-sm text-gris-moyen mb-2">
                                {clientDisplayName}
                              </div>
                            )}
                            {clientEmail && (
                              <div className="text-sm text-gris-moyen mb-2">
                                {clientEmail}
                                {clientPhone ? ` · ${clientPhone}` : ""}
                              </div>
                            )}

                            {formula && (
                              <div className="text-sm text-gris-moyen mb-3">
                                Formule : {formula.label} ({formula.price} €)
                              </div>
                            )}
                            {request.address && (
                              <div className="text-sm text-gris-moyen mb-3">
                                Adresse : {request.address}
                              </div>
                            )}

                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>

                            {request.message && (
                              <div className="mt-3 p-3 bg-muted/50 rounded">
                                <p className="text-sm">{request.message}</p>
                              </div>
                            )}

                            <RequestItemsUploader requestId={request.id} />
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {canAccept && (
                              <Button
                                size="sm"
                                onClick={() => handleAccept(request.id)}
                                className="h-8 px-3"
                              >
                                Accepter
                              </Button>
                            )}
                            {canRefuse && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRefuse(request.id)}
                                className="h-8 px-3"
                              >
                                Refuser
                              </Button>
                            )}
                            {canAdvance && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAdvanceStatus(request.id)}
                                className="h-8 px-3 text-xs"
                              >
                                {NEXT_STATUS_LABEL[request.status]}
                              </Button>
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
