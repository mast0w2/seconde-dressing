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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { montantCliente } from "@/lib/pricing";
import { DELAI_VALIDATION_HEURES, attendLaCliente, estVendue } from "@/lib/item-status";
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
    const finalisees = lignes.filter((l) => l.statut === "finalized");
    const vendues = lignes.filter((l) => estVendue(l.statut));
    const montantFinalise = finalisees.reduce((s, l) => s + (versPrix(l.prixVente) ?? 0), 0);
    const montantVendu = vendues.reduce((s, l) => s + (versPrix(l.prixVente) ?? 0), 0);
    return {
      nbVendues: vendues.length,
      nbFinalisees: finalisees.length,
      partFinalisee: montantCliente(montantFinalise),
      partAVenir: montantCliente(montantVendu - montantFinalise),
    };
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
        <Synthese
          nbVendues={bilan.nbVendues}
          nbFinalisees={bilan.nbFinalisees}
          partFinalisee={bilan.partFinalisee}
          partAVenir={bilan.partAVenir}
        />
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
    <div className="border border-[#b3aacb] bg-[#f3f1f7] p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-[#4c4663]" />
        <div className="text-sm text-[#4c4663]">
          <p className="font-medium">
            {nombre} pièce{nombre > 1 ? "s" : ""} attend{nombre > 1 ? "ent" : ""} votre accord
            sur les prix.
          </p>
          <p className="mt-1">
            Le <strong>prix affiché</strong> est celui auquel la pièce sera mise en ligne. Le{" "}
            <strong>prix minimal</strong> est le plancher : elle ne sera jamais vendue en
            dessous. Vous pouvez les ajuster avant de valider.
          </p>
          <p className="mt-1">
            {restant != null && restant > 0 ? (
              <>
                Il vous reste <strong>{formaterDelai(restant)}</strong>. Sans réponse, les prix
                proposés s&apos;appliqueront et la vente démarrera.
              </>
            ) : (
              <>
                Le délai de {DELAI_VALIDATION_HEURES} h est écoulé : la vente peut démarrer aux
                prix proposés.
              </>
            )}
          </p>
        </div>
      </div>
      <Button type="button" size="sm" onClick={onValiderTout}>
        <Check className="mr-2 h-4 w-4" />
        Tout valider
      </Button>
    </div>
  );
}

function Synthese({
  nbVendues,
  nbFinalisees,
  partFinalisee,
  partAVenir,
}: {
  nbVendues: number;
  nbFinalisees: number;
  partFinalisee: number;
  partAVenir: number;
}) {
  if (nbVendues === 0) {
    return (
      <div className="border border-noir/10 bg-gris-tres-clair p-4 text-sm text-gris-moyen">
        Aucune pièce vendue pour le moment. Dès qu&apos;une vente est conclue, le montant qui
        vous revient apparaît ici.
      </div>
    );
  }

  const total = partFinalisee + partAVenir;

  return (
    <div className="border border-noir/10 bg-gris-tres-clair p-4">
      <p className="font-serif text-xl leading-snug text-noir">
        Vous allez recevoir {euros(total)} pour {nbVendues} pièce{nbVendues > 1 ? "s" : ""} déjà
        vendue{nbVendues > 1 ? "s" : ""}.
      </p>
      <p className="mt-1.5 text-sm text-gris-moyen">
        Le virement part sous {DELAI_VIREMENT_JOURS} jours après la vente.
        {nbFinalisees > 0 && partFinalisee > 0 && (
          <>
            {" "}
            {euros(partFinalisee)} vous {nbFinalisees > 1 ? "ont" : "a"} déjà été versé
            {nbFinalisees > 1 ? "s" : ""}.
          </>
        )}
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
      className={`border p-3 ${
        aValider ? "border-[#b3aacb] bg-[#faf9fc]" : "border-noir/10 bg-blanc"
      }`}
    >
      <div className="flex gap-3">
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
              className="h-16 w-16 border border-noir/10 object-cover"
            />
          </button>
        ) : (
          <div className="h-16 w-16 shrink-0 border border-dashed border-noir/15" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-noir">{ligne.description || "Pièce"}</p>
          {ligne.marque && <p className="text-xs text-gris-moyen">{ligne.marque}</p>}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <Pastille statut={ligne.statut} pour="client" />
            <PartCliente ligne={ligne} />
          </div>
        </div>
      </div>

      {aValider ? (
        <div className="mt-3 space-y-2 border-t border-[#b3aacb]/50 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.12em] text-gris-moyen">
                Prix affiché
              </span>
              <Input
                value={ligne.prixDepart}
                onChange={(e) => onChange({ prixDepart: e.target.value })}
                inputMode="decimal"
                className="h-9 border-noir/15 bg-blanc px-2 tabular-nums text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.12em] text-gris-moyen">
                Prix minimal
              </span>
              <Input
                value={ligne.prixMin}
                onChange={(e) => onChange({ prixMin: e.target.value })}
                inputMode="decimal"
                className="h-9 border-noir/15 bg-blanc px-2 tabular-nums text-sm"
              />
            </label>
          </div>

          <Textarea
            value={ligne.noteCliente}
            onChange={(e) => onChange({ noteCliente: e.target.value })}
            rows={2}
            placeholder="Une remarque sur cette pièce ? (facultatif)"
            className="resize-none border-noir/15 bg-blanc text-sm"
          />

          <Button type="button" size="sm" onClick={onValider} disabled={enCours}>
            <Check className="mr-2 h-4 w-4" />
            {enCours ? "Validation…" : "Valider ces prix"}
          </Button>
        </div>
      ) : (
        (versPrix(ligne.prixMin) != null || ligne.noteCliente) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-noir/10 pt-2 text-xs text-gris-moyen">
            {versPrix(ligne.prixMin) != null && (
              <span className="inline-flex items-center gap-1">
                {ligne.prixValidesLe && <Lock className="h-3 w-3" />}
                Prix minimal : {euros(versPrix(ligne.prixMin) as number)}
              </span>
            )}
            {ligne.noteCliente && <span>Votre remarque : {ligne.noteCliente}</span>}
          </div>
        )
      )}
    </div>
  );
}

// ===========================================================================
// Ce que la cliente touche sur une pièce
// ===========================================================================

function PartCliente({ ligne }: { ligne: Ligne }) {
  const prix = versPrix(ligne.prixVente);

  if (ligne.statut === "finalized" && prix != null) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-noir">
        {euros(montantCliente(prix))}
        <span className="text-[11px] text-gris-moyen">versés</span>
      </span>
    );
  }

  if (ligne.statut === "sold" && prix != null) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums text-gris-moyen">
        {euros(montantCliente(prix))}
        <span className="text-[11px]">à venir</span>
      </span>
    );
  }

  return <span className="text-gris-moyen">—</span>;
}

export default InventaireCliente;
