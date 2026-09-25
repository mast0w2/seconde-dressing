"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isProfileComplete } from "@/lib/profile";
import type {
  Request,
  Profile,
  Formula,
  RequestStatus,
  RequestContract,
  SellerStatus,
} from "@/types/database";
import { requestStatusConfig, POST_COLLECTION_STATUS_OPTIONS } from "@/lib/request-status";
import { ArrowLeft } from "lucide-react";
import { RequestItemsUploader } from "@/components/RequestItemsUploader";
import { RequestAccordion } from "@/components/RequestAccordion";
import { ContractStatus } from "@/components/ContractStatus";
import { embeddedContract } from "@/lib/contract-api";

interface RequestWithRelations extends Request {
  client: Profile | null;
  formula: Formula | null;
  contract: RequestContract | RequestContract[] | null;
}

const REQUEST_SELECT = `*, client:client_id (id, first_name, last_name, email, phone), formula:formula_id (id, slug, label, price), contract:request_contracts (*)`;

// Les demandes encore ouvertes viennent de la vue `requests_ouvertes`, qui ne
// porte aucune coordonnée : ni nom, ni email, ni téléphone. La table
// `requests` ne les laisse plus lire tant qu'on ne s'est pas attribué la
// demande — l'écran masquait déjà ces informations, mais elles arrivaient
// quand même dans la réponse réseau.
//
// Pas de jointure imbriquée ici : PostgREST ne déduit pas toujours les
// relations depuis une vue. La formule est rattachée en JS, à partir de la
// table de référence chargée en parallèle.
const OPEN_REQUEST_SELECT = "*";

// A seller works only once an admin has approved her (migration 0019). The
// column is missing until that migration runs: treat its absence as
// approved, the database did not gate anything back then either.
function sellerStatusOf(profile: Profile): SellerStatus {
  return profile.seller_status ?? "approved";
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  // request ids the current seller refused (still open for other sellers)
  const [refusedIds, setRefusedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async (userId: string) => {
    // Accepted requests (assigned to this seller, any status) + open requests
    // (pending). Refusals are tracked per seller so a refused request stays
    // open for others but is hidden from this seller's "nouvelles".
    const [acceptedRes, openRes, refusRes, formulasRes] = await Promise.all([
      supabase
        .from("requests")
        .select(REQUEST_SELECT)
        .eq("seller_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("requests_ouvertes")
        .select(OPEN_REQUEST_SELECT)
        .order("created_at", { ascending: false }),
      supabase
        .from("request_refusals")
        .select("request_id")
        .eq("seller_id", userId),
      supabase.from("formulas").select("id, slug, label, price"),
    ]);

    if (acceptedRes.error) throw acceptedRes.error;
    if (openRes.error) throw openRes.error;
    if (refusRes.error) throw refusRes.error;
    if (formulasRes.error) throw formulasRes.error;

    const formulasById = new Map<string, Formula>(
      (formulasRes.data || []).map((f) => [f.id as string, f as Formula])
    );
    const openRequests = (openRes.data || []).map((r) => ({
      ...r,
      client: null,
      formula: r.formula_id ? formulasById.get(r.formula_id as string) ?? null : null,
      contract: null,
    }));

    setRefusedIds(new Set<string>((refusRes.data || []).map((r) => r.request_id)));

    // Merge, dedupe by id, keep newest first
    const merged: RequestWithRelations[] = [
      ...(acceptedRes.data || []),
      ...openRequests,
    ] as unknown as RequestWithRelations[];
    const seen = new Set<string>();
    const unique = merged.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    setRequests(unique);
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
        router.push("/profile?incomplete=1&redirect=/dashboard/seller");
        return;
      }

      // Not approved yet: the database would return nothing anyway.
      if (sellerStatusOf(profileData as Profile) !== "approved") {
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

  // Seller accepts a request: it becomes theirs and leaves the open pool for
  // everyone else. The first seller to accept wins.
  //
  // Pas d'UPDATE direct ici : sous RLS, la vendeuse n'a aucune politique de
  // lecture sur une demande qui ne lui est pas encore attribuée, et Postgres
  // exige cette visibilité pour filtrer les lignes d'un UPDATE. L'UPDATE ne
  // touchait donc aucune ligne et PostgREST répondait 204 — succès, zéro
  // ligne, aucune erreur remontée. `accept_request` est le pendant en
  // écriture de la vue `requests_ouvertes` (voir 0018).
  const handleAccept = async (requestId: string) => {
    if (!user) return;
    try {
      const { data: claimed, error } = await supabase.rpc("accept_request", {
        request_id: requestId,
      });

      if (error) throw error;

      await fetchRequests(user.id);

      // La fonction renvoie false quand une autre vendeuse a gagné la course.
      if (!claimed) {
        toast({
          title: "Demande déjà prise",
          description: "Une autre vendeuse l'a acceptée avant vous.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Demande acceptée", description: "Le client a été notifié." });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Seller refuses a request: the global status is NOT changed, so another
  // seller can still accept it. We only record the refusal for this seller.
  const handleRefuse = async (requestId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("request_refusals")
        .upsert(
          { request_id: requestId, seller_id: user.id },
          { onConflict: "request_id,seller_id" }
        );

      if (error) throw error;

      await fetchRequests(user.id);
      toast({
        title: "Demande refusée",
        description: "Cette demande reste disponible pour les autres vendeuses.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Update the status of a request the seller accepted. Passing to
  // « Articles récupérés » (or beyond) requires the deposit contract signed
  // by both parties: the database trigger refuses otherwise and its message
  // is shown as is.
  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("seller_id", user.id);

      if (error) throw error;

      await fetchRequests(user.id);
      toast({
        title: "Statut mis à jour",
        description: `La demande est passée en "${requestStatusConfig[newStatus].label}".`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Le nom ne s'affiche qu'une fois la demande attribuée. La garde reste ici
  // même si la base ne livre plus rien avant : les demandes déjà acceptées
  // passent par le même rendu.
  const nomClient = (request: RequestWithRelations, userId?: string) => {
    if (request.seller_id !== userId) return "";
    const client = request.client;
    return client
      ? `${client.first_name} ${client.last_name}`.trim()
      : `${request.client_first_name ?? ""} ${request.client_last_name ?? ""}`.trim();
  };

  const renderRequestSummary = (request: RequestWithRelations) => {
    const statusInfo = requestStatusConfig[request.status];
    const formula = request.formula;
    // Avant attribution, la demande n'arrive plus avec la moindre coordonnée :
    // nomClient est alors vide, et seule l'adresse renseigne la vendeuse.
    const clientDisplayName = nomClient(request, user?.id);

    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className={`p-2 rounded-full ${statusInfo.color}`}>
          {statusInfo.icon}
        </div>
        <div className="font-semibold">Demande #{request.id.slice(0, 8)}</div>
        <div className="text-sm text-gris-moyen">
          {new Date(request.created_at).toLocaleDateString("fr-FR")}
        </div>
        {clientDisplayName && (
          <div className="text-sm text-gris-moyen">· {clientDisplayName}</div>
        )}
        {formula && (
          <div className="text-sm text-gris-moyen">
            · {formula.label} ({formula.price} €)
          </div>
        )}
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
      </div>
    );
  };

  const renderRequestDetails = (
    request: RequestWithRelations,
    tab: "new" | "accepted" | "refused"
  ) => {
    const statusInfo = requestStatusConfig[request.status];
    const client = request.client;
    const formula = request.formula;
    const isAssignedToMe = request.seller_id === user?.id;
    const clientDisplayName = nomClient(request, user?.id);
    const clientEmail = isAssignedToMe ? client?.email ?? request.client_email ?? null : null;
    const clientPhone = isAssignedToMe ? client?.phone ?? request.client_phone ?? null : null;

    return (
      // flex-col sur mobile : la colonne de boutons à largeur fixe (min-w-[180px])
      // ne pouvait pas rétrécir dans une rangée non empilable et débordait,
      // désalignant les boutons sur petit écran.
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          {clientDisplayName && (
            <div className="text-sm text-gris-moyen mb-2">
              {clientDisplayName}
            </div>
          )}
          {isAssignedToMe && clientEmail && (
            <div className="text-sm text-gris-moyen mb-2">
              {clientEmail}
              {clientPhone ? ` · ${clientPhone}` : ""}
            </div>
          )}
          {!isAssignedToMe && tab !== "refused" && (
            <div className="text-sm text-gris-moyen mb-2 italic">
              Coordonnées visibles après acceptation de la demande
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

          {isAssignedToMe && (
            <ContractStatus
              requestId={request.id}
              status={request.status}
              role="seller"
              contract={embeddedContract(request.contract)}
              defaultItemsCount={request.number_of_items}
              onGenerated={() => user && fetchRequests(user.id)}
              onConfirmCollected={() => handleUpdateStatus(request.id, "items_collected")}
            />
          )}

          <RequestItemsUploader
            requestId={request.id}
            role="seller"
            formulaSlug={formula?.slug ?? null}
          />
        </div>

        <div className="flex flex-col gap-2 sm:shrink-0 sm:min-w-[180px]">
          {tab === "new" && (
            <>
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                className="h-8 px-3 w-full sm:w-auto"
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefuse(request.id)}
                className="h-8 px-3 w-full sm:w-auto"
              >
                Refuser
              </Button>
            </>
          )}

          {/* Avant la récupération, l'avancement passe par le panneau
              contrat (préparer → signatures → confirmer). Ensuite seulement,
              la vendeuse fait évoluer le statut ici. */}
          {tab === "accepted" && request.status !== "accepted" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gris-moyen mb-1">
                Statut de la commande
              </label>
              <Select
                value={request.status}
                onChange={(e) =>
                  handleUpdateStatus(request.id, e.target.value as RequestStatus)
                }
                className="h-9"
              >
                {POST_COLLECTION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {requestStatusConfig[status].label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {tab === "refused" && (
            <div className="text-xs text-gris-moyen italic">
              Disponible pour les autres vendeuses
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const sellerStatus = sellerStatusOf(profile);
  if (sellerStatus !== "approved") {
    return <SellerAwaitingApproval status={sellerStatus} />;
  }

  // Split requests into the three tabs.
  const newRequests: RequestWithRelations[] = [];
  const acceptedRequests: RequestWithRelations[] = [];
  const refusedRequests: RequestWithRelations[] = [];

  for (const request of requests) {
    if (request.seller_id === user.id) {
      acceptedRequests.push(request);
    } else if (refusedIds.has(request.id)) {
      refusedRequests.push(request);
    } else {
      newRequests.push(request);
    }
  }

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

        <Tabs defaultValue="new">
          {/* whitespace-normal + h-auto : les libellés avec compteur ("Nouvelles
              demandes (3)") débordaient de leur colonne sur mobile (base
              TabsTrigger a whitespace-nowrap, ici surchargé) et se
              chevauchaient avec l'onglet voisin. */}
          <TabsList className="w-full grid grid-cols-3 border-b border-noir/10">
            <TabsTrigger
              value="new"
              className="h-auto min-h-12 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-noir data-[state=active]:text-noir data-[state=inactive]:text-gris-moyen text-xs sm:text-sm tracking-wide whitespace-normal text-center leading-tight px-1"
            >
              Nouvelles demandes ({newRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="h-auto min-h-12 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-noir data-[state=active]:text-noir data-[state=inactive]:text-gris-moyen text-xs sm:text-sm tracking-wide whitespace-normal text-center leading-tight px-1"
            >
              Demandes acceptées ({acceptedRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="refused"
              className="h-auto min-h-12 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-noir data-[state=active]:text-noir data-[state=inactive]:text-gris-moyen text-xs sm:text-sm tracking-wide whitespace-normal text-center leading-tight px-1"
            >
              Demandes refusées ({refusedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {newRequests.length === 0 ? (
              <div className="text-center py-12 text-gris-moyen">
                <p>Aucune nouvelle demande.</p>
              </div>
            ) : (
              newRequests.map((request) => (
                <RequestAccordion
                  key={request.id}
                  header={renderRequestSummary(request)}
                >
                  {renderRequestDetails(request, "new")}
                </RequestAccordion>
              ))
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedRequests.length === 0 ? (
              <div className="text-center py-12 text-gris-moyen">
                <p>Aucune demande acceptée pour le moment.</p>
              </div>
            ) : (
              acceptedRequests.map((request) => (
                <RequestAccordion
                  key={request.id}
                  header={renderRequestSummary(request)}
                >
                  {renderRequestDetails(request, "accepted")}
                </RequestAccordion>
              ))
            )}
          </TabsContent>

          <TabsContent value="refused" className="space-y-4">
            {refusedRequests.length === 0 ? (
              <div className="text-center py-12 text-gris-moyen">
                <p>Aucune demande refusée.</p>
              </div>
            ) : (
              refusedRequests.map((request) => (
                <RequestAccordion
                  key={request.id}
                  header={renderRequestSummary(request)}
                >
                  {renderRequestDetails(request, "refused")}
                </RequestAccordion>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SellerAwaitingApproval({ status }: { status: SellerStatus }) {
  const rejected = status === "rejected";

  return (
    <div className="container py-8 max-w-3xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl">
            {rejected
              ? "Votre compte vendeuse n’a pas été validé"
              : "Votre compte vendeuse est en cours de validation"}
          </h1>
          <p className="text-gris-moyen mt-2">
            {rejected
              ? "Notre équipe n’a pas pu valider votre compte vendeuse. Écrivez-nous si vous souhaitez en savoir plus."
              : "Notre équipe vérifie chaque compte vendeuse avant de lui ouvrir les demandes des clientes. Vous recevrez un e-mail dès que ce sera fait."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {rejected ? (
            <Button asChild>
              <Link href="/contact">Nous contacter</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/profile">Voir mon profil</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
