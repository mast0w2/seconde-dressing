// src/lib/contract-api.ts
// Appels côté navigateur vers /api/contracts, partagés par les tableaux de
// bord, le bloc ContractStatus et la page du contrat.

import type { RequestContract, UnsoldItemsChoice } from "@/types/database";

/**
 * Le contrat embarqué dans une requête `requests` via
 * `contract:request_contracts(*)`. PostgREST renvoie un objet (FK unique) ou
 * un tableau selon la version : on normalise.
 */
export function embeddedContract(
  value: RequestContract | RequestContract[] | null | undefined
): RequestContract | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export interface ContractSetup {
  items_count: number;
  unsold_items: UnsoldItemsChoice;
}

async function parse<T>(res: Response, fallback: string): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || fallback);
  return json as T;
}

/** Le contrat d'une demande, ou null s'il n'a pas encore été généré. */
export async function fetchContract(requestId: string): Promise<RequestContract | null> {
  const res = await fetch(`/api/contracts?request_id=${encodeURIComponent(requestId)}`);
  const json = await parse<{ data: RequestContract | null }>(res, "Impossible de charger le contrat.");
  return json.data ?? null;
}

/** Génère le contrat (vendeuse). Renvoie l'existant s'il y en a déjà un. */
export async function generateContract(
  requestId: string,
  setup: ContractSetup
): Promise<{ contract: RequestContract; created: boolean }> {
  const res = await fetch("/api/contracts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId, ...setup }),
  });
  const json = await parse<{ data: RequestContract; created: boolean }>(res, "Génération impossible.");
  return { contract: json.data, created: json.created === true };
}

export async function signContract(
  contractId: string,
  signature: string,
  signatureName: string
): Promise<RequestContract> {
  const res = await fetch(`/api/contracts/${contractId}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature, signature_name: signatureName }),
  });
  const json = await parse<{ data: RequestContract }>(res, "La signature n'a pas pu être enregistrée.");
  return json.data;
}
