// src/app/api/request-items/[id]/route.ts
// DELETE /api/request-items/[id]
// Deletes an inventory item and its files.
//
// The row is deleted with the caller's own session, so RLS decides
// (migration 0024): a party to the request, and only while the item is still
// a draft — minimum price not validated, not sold. The photo and the sale
// proof are then removed with the service role, because the storage DELETE
// policy only lets a user remove the files she uploaded herself, and either
// party may have uploaded them.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { storagePath } from "@/lib/storage";

export async function DELETE(
  _request: Request,
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

  const { data: deleted, error } = await supabase
    .from("request_items")
    .delete()
    .eq("id", id)
    .select("photo_url, sale_proof_url");

  if (error) {
    console.error("[Request items] Delete failed:", error.message);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }

  // RLS turns a refused DELETE into zero rows, not an error.
  const row = (deleted ?? [])[0] as
    | { photo_url: string | null; sale_proof_url: string | null }
    | undefined;
  if (!row) {
    return NextResponse.json(
      { error: "Cette pièce ne peut plus être supprimée : son prix minimal est validé ou elle est vendue." },
      { status: 409 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (admin) {
    const removals = [
      row.photo_url ? admin.storage.from("request-items").remove([storagePath(row.photo_url, "request-items")]) : null,
      row.sale_proof_url ? admin.storage.from("sale-proofs").remove([storagePath(row.sale_proof_url, "sale-proofs")]) : null,
    ];
    for (const result of await Promise.all(removals)) {
      // The row is gone either way: a leftover file is logged, not reported.
      if (result?.error) {
        console.error("[Request items] File not removed:", result.error.message);
      }
    }
  } else {
    console.warn("[Request items] SUPABASE_SERVICE_ROLE_KEY missing: files of item", id, "left in storage.");
  }

  return NextResponse.json({ success: true });
}
