"use client";

// Seller approval. A seller who signs up sees no request until an admin
// approves her here (migration 0019).
//
// Access is decided by the database, not by this page: is_admin(),
// admin_list_sellers() and admin_set_seller_status() all refuse anyone who
// is not listed in public.admins. The page only mirrors that answer.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { SellerStatus } from "@/types/database";

interface SellerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  street_address: string | null;
  bio: string | null;
  seller_status: SellerStatus;
  created_at: string;
  seller_reviewed_at: string | null;
}

const STATUS_LABELS: Record<SellerStatus, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

const STATUS_VARIANTS: Record<SellerStatus, "default" | "secondary" | "destructive"> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSellers = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_sellers");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setSellers((data ?? []) as SellerRow[]);
  }, [supabase, toast]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/admin");
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      if (error || isAdmin !== true) {
        setAccess("denied");
        return;
      }

      setAccess("granted");
      await loadSellers();
    })();
  }, [supabase, router, loadSellers]);

  const setStatus = async (seller: SellerRow, status: SellerStatus) => {
    setBusyId(seller.id);
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        notified?: boolean;
      };

      if (!response.ok) {
        throw new Error(body.error || "Mise à jour impossible");
      }

      const name = `${seller.first_name} ${seller.last_name}`.trim();
      toast({
        title: status === "approved" ? "Vendeuse validée" : status === "rejected" ? "Vendeuse refusée" : "Remise en attente",
        description:
          status === "approved"
            ? body.notified
              ? `${name} a été prévenue par e-mail.`
              : `${name} n'a pas pu être prévenue par e-mail : pensez à la contacter.`
            : name,
      });
      await loadSellers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Mise à jour impossible",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (access === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-noir"></div>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="container py-8 max-w-3xl">
        <h1 className="text-3xl">Accès réservé</h1>
        <p className="text-gris-moyen mt-2">Cette page est réservée aux administrateurs de Seconde.</p>
      </div>
    );
  }

  const pendingCount = sellers.filter((s) => s.seller_status === "pending").length;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl">Administration</h1>
          <p className="text-gris-moyen">
            Validez les comptes vendeuse avant qu&apos;ils accèdent aux demandes des clientes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendeuses</CardTitle>
            <CardDescription>
              {pendingCount === 0
                ? "Aucun compte en attente de validation."
                : `${pendingCount} compte${pendingCount > 1 ? "s" : ""} en attente de validation.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellers.length === 0 ? (
              <p className="text-sm text-gris-moyen">Aucune vendeuse inscrite.</p>
            ) : (
              sellers.map((seller) => (
                <div
                  key={seller.id}
                  className="flex flex-col gap-3 border border-noir/10 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-sm min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-medium text-noir">
                        {`${seller.first_name} ${seller.last_name}`.trim() || "Sans nom"}
                      </span>
                      <Badge variant={STATUS_VARIANTS[seller.seller_status]}>
                        {STATUS_LABELS[seller.seller_status]}
                      </Badge>
                    </div>
                    <p className="break-all text-gris-moyen">{seller.email}</p>
                    {seller.phone && <p className="text-gris-moyen">{seller.phone}</p>}
                    {seller.street_address && <p className="text-gris-moyen">{seller.street_address}</p>}
                    {seller.bio && <p className="text-noir whitespace-pre-wrap">{seller.bio}</p>}
                    <p className="text-xs text-gris-moyen">
                      Inscrite le {formatDate(seller.created_at)}
                      {seller.seller_reviewed_at && ` · décision le ${formatDate(seller.seller_reviewed_at)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {seller.seller_status !== "approved" && (
                      <Button
                        size="sm"
                        disabled={busyId === seller.id}
                        onClick={() => setStatus(seller, "approved")}
                      >
                        Valider
                      </Button>
                    )}
                    {seller.seller_status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === seller.id}
                        onClick={() => setStatus(seller, "rejected")}
                      >
                        {seller.seller_status === "approved" ? "Retirer l'accès" : "Refuser"}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
