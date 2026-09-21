"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import type { Request, Profile, Formula, RequestContract, RequestItem } from "@/types/database";
import { RequestItemsUploader } from "@/components/RequestItemsUploader";
import { RequestAccordion } from "@/components/RequestAccordion";
import { ContractStatus } from "@/components/ContractStatus";
import { embeddedContract } from "@/lib/contract-api";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import {
  requestStatusConfig,
} from "@/lib/request-status";
import { isProfileComplete } from "@/lib/profile";
import { ArrowLeft, PenLine, Tags } from "lucide-react";

type ItemPricing = Pick<RequestItem, "id" | "min_price" | "min_price_validated_at">;

interface RequestWithRelations extends Request {
  seller: Profile | null;
  formula: Formula | null;
  contract: RequestContract | RequestContract[] | null;
  items: ItemPricing[] | null;
}

/** Nombre de prix minimaux renseignés que la cliente n'a pas encore validés. */
function pricesToValidate(request: RequestWithRelations): number {
  return (request.items ?? []).filter((it) => it.min_price != null && !it.min_price_validated_at).length;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        router.push("/dashboard/seller");
        return;
      }

      if (!isProfileComplete(profileData)) {
        router.push("/profile?incomplete=1");
        return;
      }

      // Les demandes faites depuis le formulaire public avant de se connecter
      // ne portent pas encore de client_id : on les rattache ici, au cas où
      // la session n'est pas passée par /api/auth/login ou le lien magique.
      await attachAnonymousRequests(supabase);

      const { data: requestsData, error } = await supabase
        .from("requests")
        .select(`
          *,
          seller:seller_id (id, first_name, last_name),
          formula:formula_id (id, slug, label, price),
          contract:request_contracts (*),
          items:request_items (id, min_price, min_price_validated_at)
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

  const renderRequestSummary = (request: RequestWithRelations) => {
    const statusInfo = requestStatusConfig[request.status];
    const formula = request.formula;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className={`p-2 rounded-full ${statusInfo.color}`}>
          {statusInfo.icon}
        </div>
        <div className="font-semibold">Demande #{request.id.slice(0, 8)}</div>
        <div className="text-sm text-gris-moyen">
          {new Date(request.created_at).toLocaleDateString("fr-FR")}
        </div>
        {formula && (
          <div className="text-sm text-gris-moyen">
            · {formula.label} ({formula.price} €)
          </div>
        )}
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
      </div>
    );
  };

  const renderRequestDetails = (request: RequestWithRelations) => {
    const statusInfo = requestStatusConfig[request.status];
    const seller = request.seller;
    const formula = request.formula;

    return (
      <div className="space-y-3">
        {seller && (
          <div className="text-sm text-gris-moyen">
            Vendeuse : {seller.first_name} {seller.last_name}
          </div>
        )}

        {formula && (
          <div className="text-sm text-gris-moyen">
            Formule : {formula.label} ({formula.price} €)
          </div>
        )}

        {request.address && (
          <div className="text-sm text-gris-moyen">
            Adresse : {request.address}
          </div>
        )}

        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>

        {request.message && (
          <div className="p-3 bg-muted/50 rounded">
            <p className="text-sm">{request.message}</p>
          </div>
        )}

        <ContractStatus
          requestId={request.id}
          status={request.status}
          role="client"
          contract={embeddedContract(request.contract)}
        />

        <RequestItemsUploader
          requestId={request.id}
          role="client"
          formulaSlug={formula?.slug ?? null}
          onItemsChange={fetchData}
        />
      </div>
    );
  };

  // Actions en attente de la cliente, mises en avant au-dessus de la liste.
  const contractsToSign = requests.filter((r) => {
    const c = embeddedContract(r.contract);
    return c && !c.client_signed_at;
  });
  const requestsWithPricesToValidate = requests.filter((r) => pricesToValidate(r) > 0);
  const hasTodo = contractsToSign.length > 0 || requestsWithPricesToValidate.length > 0;

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
            <h1 className="text-3xl">Tableau de bord</h1>
            <p className="text-gris-moyen">Suivez l&apos;état de vos demandes de rendez-vous</p>
          </div>
        </div>

        {hasTodo && (
          <div className="border border-sauge-fonce bg-sauge-clair/30 p-5 sm:p-6 space-y-4">
            <div className="eyebrow">À faire</div>
            <ul className="space-y-3">
              {contractsToSign.map((r) => (
                <li key={`contract-${r.id}`} className="flex flex-wrap items-center gap-3">
                  <PenLine className="h-4 w-4 text-sauge-fonce shrink-0" />
                  <span className="flex-1 text-sm text-noir">
                    Le contrat de dépôt-vente de la demande #{r.id.slice(0, 8)} attend votre
                    signature. Sans elle, la vendeuse ne peut pas confirmer la récupération de
                    vos pièces.
                  </span>
                  <Button asChild size="sm" className="h-8 px-3">
                    <Link href={`/dashboard/contract/${r.id}`}>Lire et signer</Link>
                  </Button>
                </li>
              ))}
              {requestsWithPricesToValidate.map((r) => (
                <li key={`prices-${r.id}`} className="flex flex-wrap items-center gap-3">
                  <Tags className="h-4 w-4 text-sauge-fonce shrink-0" />
                  <span className="flex-1 text-sm text-noir">
                    {pricesToValidate(r)} prix minimal{pricesToValidate(r) > 1 ? "aux" : ""} à valider
                    sur la demande #{r.id.slice(0, 8)} (dans l&apos;inventaire, ci-dessous).
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mes demandes</CardTitle>
            <CardDescription>Suivez l&apos;état de vos demandes de rendez-vous</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gris-moyen">
                <p className="mb-4">Aucune demande trouvée.</p>
                <Button asChild>
                  <Link href="/appointment-request">Faire une nouvelle demande</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <RequestAccordion
                    key={request.id}
                    header={renderRequestSummary(request)}
                  >
                    {renderRequestDetails(request)}
                  </RequestAccordion>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
