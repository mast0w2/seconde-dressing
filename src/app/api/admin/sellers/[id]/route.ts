// src/app/api/admin/sellers/[id]/route.ts
// POST /api/admin/sellers/[id] { status: "approved" | "rejected" | "pending" }
// Approves or rejects a seller account, and emails the seller once approved.
//
// The admin check belongs to the database: admin_set_seller_status() runs
// with the caller's own session and refuses anyone missing from
// public.admins (migration 0019). This route only adds the email.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notificationService } from "@/lib/email";
import type { SellerStatus } from "@/types/database";

const STATUSES: SellerStatus[] = ["pending", "approved", "rejected"];

// PostgreSQL's insufficient_privilege, raised for non-admins.
const INSUFFICIENT_PRIVILEGE = "42501";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status as SellerStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_set_seller_status", {
    target_id: id,
    new_status: status,
  });

  if (error) {
    if (error.code === INSUFFICIENT_PRIVILEGE) {
      return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
    }
    console.error("[Admin sellers] Status change failed:", error.message);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  const seller = (Array.isArray(data) ? data[0] : data) as
    | { email: string; first_name: string }
    | undefined;
  if (!seller) {
    return NextResponse.json({ error: "Vendeuse introuvable" }, { status: 404 });
  }

  let notified = false;
  if (status === "approved" && process.env.BREVO_API_KEY) {
    const sent = await notificationService.sendSellerApproved(seller.email, seller.first_name);
    notified = sent.success;
    if (!sent.success) {
      console.error(
        "[Admin sellers] Approval email not sent to",
        seller.email,
        "-",
        sent.error || sent.message
      );
    }
  }

  return NextResponse.json({ status, notified });
}
