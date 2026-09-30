"use client";

// Inventaire vu par la cliente : lecture seule, avec un moment où elle a la
// main — la validation des prix.
//
// CE QU'ELLE NE VOIT PAS, et pourquoi :
//   * le prix de vente brut d'une pièce vendue : elle voit sa part ;
//   * les parts vendeuse et Seconde : notre marge n'est pas son sujet, et la
//     lui afficher ligne à ligne transforme chaque vente en négociation.
//
// CE QU'ELLE PEUT FAIRE :
//   Quand la vendeuse lui soumet les prix, chaque pièce passe en « Prix à
//   valider » et la cliente dispose de 48 h pour ajuster le prix de départ,
//   relever son prix plancher, laisser une remarque, puis valider. Valider
//   verrouille le prix minimal et lance la vente. Sans réponse au bout de
//   48 h, les prix proposés s'appliquent : sinon un inventaire entier
//   resterait bloqué sur une pièce oubliée.

import { useMemo, useState } from "react";
import { Check, Hourglass, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { montantCliente } from "@/lib/pricing";
import { DELAI_VALIDATION_HEURES, attendLaCliente, venteAcquise } from "@/lib/item-status";
import type { ItemStatus } from "@/types/database";
import {
  Loupe,
  Pastille,
  euros,
  formaterDelai,
  heuresRestantes,
  useInventaire,
  versPrix,
  type Ligne,
} from "./commun";

interface Props {
  requestId: string;
  formulaSlug?: string | null;
  onItemsChange?: () => void;
}

/** Délai annoncé partout : contrat de dépôt-vente, CGV, emails, et ici. */
const DELAI_VIREMENT_JOURS = 60;

export function InventaireCliente({ requestId, onItemsChange }: Props) {
  const { toast } = useToast();
  const { lignes, setLignes, chargement, urlsSignees, supabase } = useInventaire(requestId);
  const [loupe, setLoupe] = useState<{ src: string; legende: string } | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  const majLocale = (localId: string, patch: Partial<Ligne>) =>
    setLignes((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...patch } : l)));

  const aValider = useMemo(() => lignes.filter((l) => attendLaCliente(l.statut)), [lignes]);

  // -------------------------------------------------------------------------
  // Ce que la cliente touche : 50 % des pièces FINALISÉES uniquement.
  // Tant que la vente n'est pas actée, annoncer une somme crée exactement la
  // frustration qu'on veut éviter.
  // -------------------------------------------------------------------------
  const bilan = useMemo(() => {
    const acquises = lignes.filter((l) => venteAcquise(l.statut));
    const montant = acquises.reduce((s, l) => s + (versPrix(l.prixVente) ?? 0), 0);
    return { nbVendues: acquises.length, part: montantCliente(montant) };
  }, [lignes]);

  // -------------------------------------------------------------------------
  // Écritures
  // -------------------------------------------------------------------------

  const ecrire = async (ligne: Ligne, patch: Record<string, unknown>): Promise<boolean> => {
    if (!ligne.itemId) return false;
    const { error } = await supabase.from("request_items").update(patch).eq("id", ligne.itemId);
    if (error) {
      toast({ title: "Modification refusée", description: error.message, variant: "destructive" });
      return false;
    }
    onItemsChange?.();
    return true;
  };

  const valider = async (ligne: Ligne) => {
    const plancher = versPrix(ligne.prixMin);
    const depart = versPrix(ligne.prixDepart);
    if (plancher == null) {
      toast({
        title: "Prix minimal manquant",
        description: "Indiquez en dessous de quel prix vous ne souhaitez pas vendre.",
        variant: "destructive",
      });
      return;
    }
    if (depart != null && depart < plancher) {
      toast({
        title: "Prix incohérents",
        description: "Le prix affiché ne peut pas être inférieur à votre prix minimal.",
        variant: "destructive",
      });
      return;
    }

    setEnCours(ligne.localId);
    const maintenant = new Date().toISOString();
    const ok = await ecrire(ligne, {
      min_price: plancher,
      starting_price: depart,
      client_note: ligne.noteCliente.trim() || null,
      min_price_validated_at: maintenant,
      status: "on_sale",
    });
    setEnCours(null);
    if (!ok) return;
    majLocale(ligne.localId, {
      statut: "on_sale" as ItemStatus,
      prixValidesLe: maintenant,
    });
  };

  const validerTout = async () => {
    for (const ligne of aValider) {
      // Une par une : le message d'erreur doit désigner la pièce en cause.
      // eslint-disable-next-line no-await-in-loop
      await valider(ligne);
    }
  };

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------

  if (chargement) {
    return <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>;
  }

  if (lignes.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        L&apos;inventaire de vos pièces apparaîtra ici dès que la vendeuse l&apos;aura établi.
      </p>
    );
  }

  const restant =
    aValider.length > 0
      ? heuresRestantes(aValider[0].prixEnvoyesLe, DELAI_VALIDATION_HEURES)
      : null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-serif text-xl leading-none text-noir">Vos pièces</h4>
        <span className="text-sm text-gris-moyen">
          {lignes.length} {lignes.length > 1 ? "pièces" : "pièce"}
        </span>
      </div>

      {aValider.length > 0 ? (
        <AValider
          nombre={aValider.length}
          heuresRestantes={restant}
          onValiderTout={() => void validerTout()}
        />
      ) : (
        <Synthese nbVendues={bilan.nbVendues} part={bilan.part} />
      )}

      <div className="space-y-2">
        {lignes.map((ligne) => (
          <CartePiece
            key={ligne.localId}
            ligne={ligne}
            src={ligne.photoUrl ? urlsSignees[ligne.photoUrl] ?? null : null}
            enCours={enCours === ligne.localId}
            onChange={(patch) => majLocale(ligne.localId, patch)}
            onValider={() => void valider(ligne)}
            onLoupe={setLoupe}
          />
        ))}
      </div>

      <Loupe src={loupe?.src ?? null} legende={loupe?.legende} onClose={() => setLoupe(null)} />
    </div>
  );
}

// ===========================================================================
// Bandeaux de tête
// ===========================================================================

function AValider({
  nombre,
  heuresRestantes: restant,
  onValiderTout,
}: {
  nombre: number;
  heuresRestantes: number | null;
  onValiderTout: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-[#b3aacb] bg-[#f3f1f7] px-4 py-3 text-sm text-[#4c4663]">
      <Hourglass className="h-4 w-4 shrink-0" />
      <p className="min-w-[240px] flex-1">
        <span className="text-noir">
          {nombre} pièce{nombre > 1 ? "s" : ""} attend{nombre > 1 ? "ent" : ""} votre accord.
        </span>{" "}
        Le <strong>prix de départ</strong> est celui auquel la pièce sera mise en ligne, le{" "}
        <strong>prix minimal</strong> le plancher en dessous duquel elle ne sera jamais vendue.
        {restant != null && restant > 0 ? (
          <> Il vous reste {formaterDelai(restant)} : sans réponse, ces prix s&apos;appliquent.</>
        ) : (
          <> Le délai de {DELAI_VALIDATION_HEURES} h est écoulé, ces prix vont s&apos;appliquer.</>
        )}
      </p>
      <Button type="button" size="sm" onClick={onValiderTout} className="shrink-0">
        <Check className="mr-2 h-4 w-4" />
        Tout valider
      </Button>
    </div>
  );
}

/**
 * Le montant qui revient à la cliente, traité comme le chiffre principal de
 * la page : c'est la seule chose qu'elle vient vérifier.
 */
function Synthese({ nbVendues, part }: { nbVendues: number; part: number }) {
  if (nbVendues === 0) {
    return (
      <div className="border border-noir/10 bg-gris-tres-clair p-4 text-sm text-gris-moyen">
        Aucune pièce vendue pour le moment. Dès qu&apos;une vente est conclue, le montant qui
        vous revient apparaît ici.
      </div>
    );
  }

  return (
    <div className="border border-sauge bg-sauge-clair/25 p-4 sm:p-5">
      <span className="text-[10px] uppercase tracking-[0.16em] text-gris-moyen">
        Ce que vous allez recevoir
      </span>
      <p className="mt-1 font-serif text-4xl leading-none tabular-nums text-noir sm:text-5xl">
        {euros(part)}
      </p>
      <p className="mt-2 text-sm text-gris-moyen">
        Pour {nbVendues} pièce{nbVendues > 1 ? "s" : ""} vendue{nbVendues > 1 ? "s" : ""}. Le
        virement part sous {DELAI_VIREMENT_JOURS} jours après la vente.
      </p>
    </div>
  );
}

// ===========================================================================
// Une pièce
// ===========================================================================

function CartePiece({
  ligne,
  src,
  enCours,
  onChange,
  onValider,
  onLoupe,
}: {
  ligne: Ligne;
  src: string | null;
  enCours: boolean;
  onChange: (patch: Partial<Ligne>) => void;
  onValider: () => void;
  onLoupe: (v: { src: string; legende: string }) => void;
}) {
  const aValider = attendLaCliente(ligne.statut);

  return (
    <div
      className={`border px-3 py-2.5 ${
        aValider ? "border-[#b3aacb] bg-[#faf9fc]" : "border-noir/10 bg-blanc"
      }`}
    >
      {/* Une seule ligne : pièce, statut, montant. Une cliente parcourt
          verticalement, chaque pièce doit tenir dans un coup d'œil. */}
      <div className="flex items-center gap-3">
        {src ? (
          <button
            type="button"
            onClick={() =>
              onLoupe({ src, legende: ligne.description || ligne.marque || "Pièce" })
            }
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={ligne.description || "Pièce"}
              className="h-12 w-12 border border-noir/10 object-cover"
            />
          </button>
        ) : (
          <div className="h-12 w-12 shrink-0 border border-dashed border-noir/15" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-noir">{ligne.description || "Pièce"}</p>
          {ligne.marque && (
            <p className="truncate text-xs text-gris-moyen">{ligne.marque}</p>
          )}
        </div>

        <Pastille statut={ligne.statut} pour="client" />
        <PartCliente ligne={ligne} />
      </div>

      {aValider ? (
        // Tout sur une ligne : une cliente qui découvre vingt pièces à
        // valider doit voir que chacune tient en trois champs, pas en un
        // formulaire.
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[#b3aacb]/50 pt-3">
          <label className="flex w-[104px] flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.1em] text-gris-moyen">
              Prix de départ
            </span>
            <Input
              value={ligne.prixDepart}
              onChange={(e) => onChange({ prixDepart: e.target.value })}
              inputMode="decimal"
              className="h-9 border-noir/15 bg-blanc px-2 tabular-nums text-sm"
            />
          </label>
          <label className="flex w-[104px] flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.1em] text-gris-moyen">
              Prix minimal
            </span>
            <Input
              value={ligne.prixMin}
              onChange={(e) => onChange({ prixMin: e.target.value })}
              inputMode="decimal"
              className="h-9 border-noir/15 bg-blanc px-2 tabular-nums text-sm"
            />
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.1em] text-gris-moyen">
              Remarque
            </span>
            <Input
              value={ligne.noteCliente}
              onChange={(e) => onChange({ noteCliente: e.target.value })}
              placeholder="Facultatif"
              className="h-9 border-noir/15 bg-blanc px-2 text-sm"
            />
          </label>
          <Button type="button" size="sm" onClick={onValider} disabled={enCours} className="h-9">
            <Check className="mr-2 h-4 w-4" />
            {enCours ? "Validation…" : "Valider"}
          </Button>
        </div>
      ) : (
        <InfosPiece ligne={ligne} />
      )}
    </div>
  );
}

/**
 * Ce qu'il reste à dire sur une pièce une fois les prix validés : son
 * plancher, la remarque de la cliente, et — quand la pièce est invendable —
 * l'explication de la vendeuse. Sans cette dernière, la cliente voit une
 * pièce écartée sans savoir pourquoi.
 */
function InfosPiece({ ligne }: { ligne: Ligne }) {
  const plancher = versPrix(ligne.prixMin);
  const motif = ligne.statut === "unsellable" ? ligne.notes.trim() : "";
  if (plancher == null && !ligne.noteCliente && !motif) return null;

  return (
    <div className="mt-2 space-y-1.5 border-t border-noir/10 pt-2 text-xs text-gris-moyen">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {plancher != null && (
          <span className="inline-flex items-center gap-1">
            {ligne.prixValidesLe && <Lock className="h-3 w-3" />}
            Prix minimal : {euros(plancher)}
          </span>
        )}
        {ligne.noteCliente && <span>Votre remarque : {ligne.noteCliente}</span>}
      </div>
      {motif && (
        <p className="inline-block border-l-2 border-[#cda894] bg-[#fbf4f1] px-2 py-1 text-[11px] text-[#7a4a37]">
          {motif}
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// Ce que la cliente touche sur une pièce
// ===========================================================================

function PartCliente({ ligne }: { ligne: Ligne }) {
  const prix = versPrix(ligne.prixVente);

  // Aucun montant tant que la vente n'est pas acquise : une somme annoncée
  // puis retirée parce qu'un acheteur a rendu l'article, c'est la pire des
  // façons de tenir quelqu'un au courant.
  if (!venteAcquise(ligne.statut) || prix == null) {
    return <span className="text-gris-moyen">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-noir">
      {euros(montantCliente(prix))}
      <span className="text-[11px] text-gris-moyen">à venir</span>
    </span>
  );
}

export default InventaireCliente;
