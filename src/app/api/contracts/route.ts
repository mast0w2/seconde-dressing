// src/app/api/contracts/route.ts
// GET  /api/contracts?request_id=…  → le contrat d'une demande (parties seulement)
// POST /api/contracts { request_id, items_count, unsold_items }
//      → génère le contrat (vendeuse assignée, demande acceptée) avec le
//      nombre de pièces constaté à la remise et le choix de la cliente pour
//      les invendus. Le contrat doit ensuite être signé par les deux parties
//      avant que la demande puisse passer en « Articles récupérés » (trigger
//      requests_require_signed_contract). Idempotent : si le contrat existe
//      déjà, il est renvoyé tel quel (les paramètres sont ignorés).
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildContractContent, CONTRACT_VERSION } from "@/lib/contract";
import type {
  Formula,
  InsertRequestContract,
  Profile,
  Request as RequestRow,
  RequestContract,
  RequestStatus,
  UnsoldItemsChoice,
} from "@/types/database";

// Statuts à partir desquels la vendeuse peut préparer le contrat.
const CONTRACT_STATUSES: RequestStatus[] = ["accepted", "items_collected", "items_on_sale", "completed"];
const UNSOLD_CHOICES: UnsoldItemsChoice[] = ["return", "donate"];

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = new URL(request.url).searchParams.get("request_id");
  if (!requestId) {
    return NextResponse.json({ error: "request_id manquant" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("request_contracts")
    .select("*")
    .eq("request_id", requestId)
    .or(`client_id.eq.${user.id},seller_id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data as RequestContract | null) ?? null });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { request_id?: string; items_count?: unknown; unsold_items?: unknown }
    | null;
  const requestId = body?.request_id;
  if (!requestId) {
    return NextResponse.json({ error: "request_id manquant" }, { status: 400 });
  }

  // Seule la vendeuse assignée peut déclencher la génération.
  const { data: req, error: reqError } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 500 });
  }
  if (!req) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
  const requestRow = req as RequestRow;
  if (!CONTRACT_STATUSES.includes(requestRow.status)) {
    return NextResponse.json(
      { error: "Le contrat ne peut être préparé qu'une fois la demande acceptée." },
      { status: 409 }
    );
  }

  // Déjà généré ? On le renvoie sans le régénérer (le contrat est figé).
  const { data: existing } = await supabase
    .from("request_contracts")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ data: existing as RequestContract, created: false });
  }

  // Paramètres saisis par la vendeuse à la remise, obligatoires à la création.
  const itemsCount = Number(body?.items_count);
  if (!Number.isInteger(itemsCount) || itemsCount < 1) {
    return NextResponse.json(
      { error: "Le nombre de pièces confiées doit être un entier supérieur ou égal à 1." },
      { status: 400 }
    );
  }
  const unsoldItems = body?.unsold_items as UnsoldItemsChoice;
  if (!UNSOLD_CHOICES.includes(unsoldItems)) {
    return NextResponse.json(
      { error: "Merci d'indiquer le choix de la cliente pour les pièces invendues." },
      { status: 400 }
    );
  }

  const [sellerRes, clientRes, formulaRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    requestRow.client_id
      ? supabase.from("profiles").select("*").eq("id", requestRow.client_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    requestRow.formula_id
      ? supabase.from("formulas").select("*").eq("id", requestRow.formula_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (sellerRes.error || !sellerRes.data) {
    return NextResponse.json({ error: "Profil vendeuse introuvable" }, { status: 500 });
  }

  const content = buildContractContent({
    request: requestRow,
    client: (clientRes.data as Profile | null) ?? null,
    seller: sellerRes.data as Profile,
    formula: (formulaRes.data as Formula | null) ?? null,
    itemsCount,
    unsoldItems,
  });

  const insert: InsertRequestContract = {
    request_id: requestId,
    client_id: requestRow.client_id,
    seller_id: user.id,
    version: CONTRACT_VERSION,
    content,
  };

  const { data: created, error: insertError } = await supabase
    .from("request_contracts")
    .insert([insert])
    .select("*")
    .single();

  if (insertError) {
    // Course entre deux clics : le contrat vient d'être créé, on le renvoie.
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("request_contracts")
        .select("*")
        .eq("request_id", requestId)
        .single();
      return NextResponse.json({ data: raced as RequestContract, created: false });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: created as RequestContract, created: true }, { status: 201 });
}
