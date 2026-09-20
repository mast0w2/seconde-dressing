// src/app/api/contracts/[id]/sign/route.ts
// POST /api/contracts/[id]/sign { signature, signature_name }
// Signe le contrat pour la partie correspondant à l'utilisateur connecté
// (cliente ou vendeuse). Une signature posée ne peut pas être remplacée.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { contractRoleFor, isSignedBy } from "@/lib/contract";
import type { RequestContract, UpdateRequestContract } from "@/types/database";

// PNG dessiné dans le navigateur : on borne la taille pour ne pas stocker
// n'importe quoi en base.
const MAX_SIGNATURE_LENGTH = 200_000;
const SIGNATURE_PREFIX = "data:image/png;base64,";

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

  const body = (await request.json().catch(() => null)) as
    | { signature?: string; signature_name?: string }
    | null;
  const signature = body?.signature ?? "";
  const signatureName = (body?.signature_name ?? "").trim();

  if (!signature.startsWith(SIGNATURE_PREFIX) || signature.length > MAX_SIGNATURE_LENGTH) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }
  if (signatureName.length < 2) {
    return NextResponse.json({ error: "Merci d'indiquer votre nom complet" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("request_contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const contract = data as RequestContract | null;
  if (!contract) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  const role = contractRoleFor(contract, user.id);
  if (!role) {
    return NextResponse.json({ error: "Vous n'êtes pas partie à ce contrat" }, { status: 403 });
  }
  if (isSignedBy(contract, role)) {
    return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 409 });
  }

  const signedAt = new Date().toISOString();
  const update: UpdateRequestContract =
    role === "client"
      ? { client_signed_at: signedAt, client_signature: signature, client_signature_name: signatureName }
      : { seller_signed_at: signedAt, seller_signature: signature, seller_signature_name: signatureName };

  // Le filtre sur la colonne *_signed_at évite d'écraser une signature posée
  // entre la lecture et l'écriture.
  const { data: updated, error: updateError } = await supabase
    .from("request_contracts")
    .update(update)
    .eq("id", id)
    .is(role === "client" ? "client_signed_at" : "seller_signed_at", null)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 409 });
  }

  return NextResponse.json({ data: updated as RequestContract });
}
