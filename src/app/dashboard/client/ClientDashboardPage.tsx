"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import type { Request, Profile, Formula } from "@/types/database";
import { RequestItemsUploader } from "@/components/RequestItemsUploader";
import { RequestAccordion } from "@/components/RequestAccordion";
import {
  requestStatusConfig,
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

        <RequestItemsUploader requestId={request.id} />
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
