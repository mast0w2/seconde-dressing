"use client";

// Briques partagées par le tableau d'inventaire de la vendeuse et par la vue
// en lecture seule de la cliente : chargement des lignes, signature des
// fichiers privés, formatage, pastille de statut, agrandissement de photo.

import { useCallback, useEffect, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { signStoredFiles } from "@/lib/storage";
import { STATUTS } from "@/lib/item-status";
import type { ItemStatus, RequestItem } from "@/types/database";

// ---------------------------------------------------------------------------
// Une ligne du tableau. Les prix sont des chaînes : on édite du texte, on ne
// convertit qu'au moment d'écrire en base.
// ---------------------------------------------------------------------------
export interface Ligne {
  /** Clé stable, y compris pendant l'upload d'une photo pas encore enregistrée. */
  localId: string;
  /** Identifiant en base, absent tant que la ligne n'est pas persistée. */
  itemId?: string;
  photoUrl: string | null;
  description: string;
  marque: string;
  statut: ItemStatus;
  prixMin: string;
  prixValidesLe: string | null;
  prixDepart: string;
  prixVente: string;
  preuveUrl: string | null;
  venduLe: string | null;
  finaliseeLe: string | null;
  notes: string;
  uploading: boolean;
  uploadingPreuve: boolean;
}

export function ligneDepuisRow(row: RequestItem): Ligne {
  return {
    localId: row.id,
    itemId: row.id,
    photoUrl: row.photo_url,
    description: row.description ?? "",
    marque: row.brand ?? "",
    statut: row.status ?? "photos_taken",
    prixMin: row.min_price != null ? String(row.min_price) : "",
    prixValidesLe: row.min_price_validated_at,
    prixDepart: row.starting_price != null ? String(row.starting_price) : "",
    prixVente: row.sale_price != null ? String(row.sale_price) : "",
    preuveUrl: row.sale_proof_url,
    venduLe: row.sold_at,
    finaliseeLe: row.finalized_at,
    notes: row.notes ?? "",
    uploading: false,
    uploadingPreuve: false,
  };
}

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

/** "12,50" comme "12.5" -> 12.5. Renvoie null si la case est vide ou absurde. */
export function versPrix(valeur: string): number | null {
  if (valeur.trim() === "") return null;
  const n = Number(valeur.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export function euros(valeur: number): string {
  return `${valeur.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

export function jour(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR");
}

// ---------------------------------------------------------------------------
// Chargement des lignes + signature des fichiers privés
// ---------------------------------------------------------------------------

export function useInventaire(requestId: string) {
  const supabase = getSupabaseClient();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [urlsSignees, setUrlsSignees] = useState<Record<string, string>>({});

  const recharger = useCallback(async () => {
    const { data, error } = await supabase
      .from("request_items")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    setChargement(false);
    if (error || !data) return;
    setLignes((data as RequestItem[]).map(ligneDepuisRow));
  }, [requestId, supabase]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  // Les buckets sont privés depuis la migration 0022 : chaque fichier est
  // signé une fois et une seule. Un fichier qu'on n'arrive pas à signer ne
  // doit pas être redemandé en boucle.
  const dejaDemandes = useRef(new Set<string>());
  useEffect(() => {
    const nouveaux = (valeurs: Array<string | null>) =>
      valeurs.filter((v): v is string => !!v && !dejaDemandes.current.has(v));
    const photos = nouveaux(lignes.map((l) => l.photoUrl));
    const preuves = nouveaux(lignes.map((l) => l.preuveUrl));
    if (photos.length === 0 && preuves.length === 0) return;
    [...photos, ...preuves].forEach((v) => dejaDemandes.current.add(v));

    (async () => {
      const [p, q] = await Promise.all([
        signStoredFiles(supabase, "request-items", photos),
        signStoredFiles(supabase, "sale-proofs", preuves),
      ]);
      setUrlsSignees((prev) => ({ ...prev, ...p, ...q }));
    })();
  }, [lignes, supabase]);

  return { lignes, setLignes, chargement, urlsSignees, recharger, supabase };
}

// ---------------------------------------------------------------------------
// Pastille de statut
// ---------------------------------------------------------------------------

export function Pastille({
  statut,
  pour = "seller",
}: {
  statut: ItemStatus;
  pour?: "seller" | "client";
}) {
  const info = STATUTS[statut];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] leading-5"
      style={{ backgroundColor: info.fond, color: info.texte, borderColor: info.bordure }}
    >
      {pour === "client" ? info.labelCliente : info.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Agrandissement d'une photo
// ---------------------------------------------------------------------------

export function Loupe({
  src,
  legende,
  onClose,
}: {
  src: string | null;
  legende?: string;
  onClose: () => void;
}) {
  return (
    <AlertDialog.Root open={!!src} onOpenChange={(o) => !o && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-noir/70" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 focus:outline-none">
          <AlertDialog.Title className="sr-only">{legende || "Photo"}</AlertDialog.Title>
          <AlertDialog.Description className="sr-only">
            Agrandissement de la photo de la pièce.
          </AlertDialog.Description>
          <div className="relative bg-blanc border border-noir/10 p-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 bg-blanc/90 border border-noir/10 p-1.5 hover:bg-gris-clair transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && <img src={src} alt={legende || "Pièce"} className="w-full object-contain max-h-[70vh]" />}
            {legende && <p className="mt-2 px-1 pb-1 text-sm text-gris-moyen">{legende}</p>}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
