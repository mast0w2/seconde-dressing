"use client";

// Briques partagées par le tableau d'inventaire de la vendeuse et par la vue
// en lecture seule de la cliente : chargement des lignes, signature des
// fichiers privés, formatage, pastille de statut, agrandissement de photo.

import { useCallback, useEffect, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  /** Envoi des prix à la cliente : point de départ de son délai de réponse. */
  prixEnvoyesLe: string | null;
  /** Remarque laissée par la cliente au moment de valider. */
  noteCliente: string;
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
    prixEnvoyesLe: row.prices_sent_at ?? null,
    noteCliente: row.client_note ?? "",
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

/**
 * Temps restant avant que le silence de la cliente vaille accord.
 * Renvoie null quand rien n'a été envoyé, et 0 quand le délai est écoulé.
 */
export function heuresRestantes(
  envoyeLe: string | null,
  delaiHeures: number
): number | null {
  if (!envoyeLe) return null;
  const fin = new Date(envoyeLe).getTime() + delaiHeures * 3600_000;
  return Math.max(0, Math.ceil((fin - Date.now()) / 3600_000));
}

/** « 36 h », « 2 h », « quelques minutes ». */
export function formaterDelai(heures: number): string {
  if (heures <= 0) return "quelques minutes";
  return `${heures} h`;
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
// Champs qui gardent leur texte pour eux
//
// Un tableau d'inventaire, c'est quarante lignes et onze colonnes. Quand
// chaque frappe au clavier remonte dans l'état du composant parent, ce sont
// les quarante lignes qui se redessinent à chaque lettre — et la saisie
// devient poisseuse.
//
// Ces champs gardent donc leur texte en local et ne préviennent le parent
// qu'à la sortie : une écriture par champ modifié, au lieu d'une par lettre.
// ---------------------------------------------------------------------------

interface ChampLocalProps {
  valeur: string;
  /** Appelé à la sortie du champ, seulement si le texte a changé. */
  onCommit: (valeur: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputMode?: "text" | "decimal";
  title?: string;
  autoFocus?: boolean;
}

/** Entrée valide la saisie et quitte la case ; c'est la sortie qui enregistre. */
function sortirSurEntree(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

export function ChampLocal({
  valeur,
  onCommit,
  disabled,
  placeholder,
  className,
  inputMode,
  title,
}: ChampLocalProps) {
  const [texte, setTexte] = useState(valeur);
  const edite = useRef(false);

  // On ne remplace le texte affiché que si personne n'est en train de
  // l'écrire : sinon une sauvegarde concurrente effacerait la frappe en cours.
  useEffect(() => {
    if (!edite.current) setTexte(valeur);
  }, [valeur]);

  return (
    <Input
      value={texte}
      onChange={(e) => setTexte(e.target.value)}
      onFocus={() => (edite.current = true)}
      onBlur={() => {
        edite.current = false;
        if (texte !== valeur) onCommit(texte);
      }}
      onKeyDown={sortirSurEntree}
      disabled={disabled}
      placeholder={placeholder}
      inputMode={inputMode}
      title={title}
      className={className}
    />
  );
}

export function ZoneLocale({
  valeur,
  onCommit,
  disabled,
  placeholder,
  className,
  rows = 2,
  autoFocus,
}: Omit<ChampLocalProps, "inputMode" | "title"> & { rows?: number }) {
  const [texte, setTexte] = useState(valeur);
  const edite = useRef(false);

  useEffect(() => {
    if (!edite.current) setTexte(valeur);
  }, [valeur]);

  return (
    <Textarea
      value={texte}
      onChange={(e) => setTexte(e.target.value)}
      onFocus={() => (edite.current = true)}
      onBlur={() => {
        edite.current = false;
        if (texte !== valeur) onCommit(texte);
      }}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      className={className}
    />
  );
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
