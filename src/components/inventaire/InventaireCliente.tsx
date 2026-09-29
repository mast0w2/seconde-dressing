"use client";

// Inventaire vu par la cliente : lecture seule, et surtout beaucoup moins
// d'informations que côté vendeuse.
//
// CE QU'ELLE NE VOIT PAS, et pourquoi :
//   * le prix de départ et le prix de vente brut : ce sont des leviers
//     commerciaux de la vendeuse, pas des engagements ;
//   * les parts vendeuse et Seconde : notre marge n'est pas son sujet, et la
//     lui afficher ligne à ligne transforme chaque vente en négociation.
// Elle voit ce qui la concerne : où en est chaque pièce, et ce qu'elle touche.
//
// La seule chose qu'elle peut écrire est la validation des prix, qui reste son
// geste : elle accepte le plancher et le prix affiché, et les verrouille.

import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { montantCliente } from "@/lib/pricing";
import { estVendue } from "@/lib/item-status";
import { minPriceEditorFor } from "@/lib/formules";
import { Loupe, Pastille, euros, useInventaire, versPrix, type Ligne } from "./commun";

interface Props {
  requestId: string;
  /** Slug de la formule : en « Déjà trié », la cliente saisit elle-même son plancher. */
  formulaSlug?: string | null;
  onItemsChange?: () => void;
}

/** Délai annoncé partout : contrat de dépôt-vente, CGV, emails, et ici. */
const DELAI_VIREMENT_JOURS = 60;

export function InventaireCliente({ requestId, formulaSlug, onItemsChange }: Props) {
  const { toast } = useToast();
  const { lignes, setLignes, chargement, urlsSignees, supabase } = useInventaire(requestId);
  const [loupe, setLoupe] = useState<{ src: string; legende: string } | null>(null);
  const [validation, setValidation] = useState(false);

  // Formule « Déjà trié » : la cliente a fait l'inventaire, elle fixe son
  // propre plancher tant qu'elle ne l'a pas validé.
  const saisitSonPlancher = minPriceEditorFor(formulaSlug) === "client";

  const majLocale = (localId: string, patch: Partial<Ligne>) =>
    setLignes((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...patch } : l)));

  const enregistrerPrixMin = async (ligne: Ligne) => {
    if (!ligne.itemId) return;
    const { error } = await supabase
      .from("request_items")
      .update({ min_price: versPrix(ligne.prixMin) })
      .eq("id", ligne.itemId);
    if (error) {
      toast({ title: "Modification refusée", description: error.message, variant: "destructive" });
      return;
    }
    onItemsChange?.();
  };

  // -------------------------------------------------------------------------
  // Ce que la cliente touche : 50 % des pièces FINALISÉES uniquement.
  // Tant que le virement n'est pas parti, l'argent n'est encore à personne ;
  // annoncer une somme qu'on n'a pas versée crée exactement la frustration
  // qu'on veut éviter.
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

  const aValider = lignes.filter(
    (l) => l.itemId && !l.prixValidesLe && versPrix(l.prixMin) != null
  );

  const validerLesPrix = async () => {
    if (aValider.length === 0) return;
    setValidation(true);
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from("request_items")
      .update({ min_price_validated_at: maintenant })
      .in("id", aValider.map((l) => l.itemId as string));
    setValidation(false);
    if (error) {
      toast({ title: "Validation refusée", description: error.message, variant: "destructive" });
      return;
    }
    setLignes((prev) =>
      prev.map((l) =>
        aValider.some((v) => v.localId === l.localId) ? { ...l, prixValidesLe: maintenant } : l
      )
    );
    onItemsChange?.();
    toast({
      title: "Prix validés",
      description: `${aValider.length} prix verrouillé${aValider.length > 1 ? "s" : ""}.`,
    });
  };

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

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium">Vos pièces</h4>
        <span className="text-sm text-gris-moyen">
          {lignes.length} {lignes.length > 1 ? "pièces" : "pièce"}
        </span>
      </div>

      <Synthese
        nbVendues={bilan.nbVendues}
        nbFinalisees={bilan.nbFinalisees}
        partFinalisee={bilan.partFinalisee}
        partAVenir={bilan.partAVenir}
      />

      {/* Validation des prix : le seul geste de la cliente sur cet écran. */}
      {aValider.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border border-noir/10 bg-gris-tres-clair p-3 text-sm">
          <p className="flex-1 text-gris-moyen">
            {saisitSonPlancher ? "Vous avez indiqué un " : "La vendeuse a fixé un "}
            <strong className="text-noir">prix minimal</strong> pour {aValider.length} pièce
            {aValider.length > 1 ? "s" : ""}. En validant, vous actez qu&apos;elles ne seront
            jamais vendues en dessous — et ces prix ne pourront plus changer.
          </p>
          <Button size="sm" onClick={validerLesPrix} disabled={validation} className="h-8 px-3">
            <Check className="mr-1 h-4 w-4" />
            {validation ? "Validation…" : `Valider ${aValider.length} prix`}
          </Button>
        </div>
      )}

      {/* Tableau */}
      <div className="hidden sm:block overflow-x-auto border border-noir/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gris-tres-clair text-left text-[11px] uppercase tracking-[0.12em] text-gris-moyen">
              <th className="px-2 py-2 w-[64px]">Photo</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Marque</th>
              <th className="px-2 py-2 text-right w-[100px]">Prix minimal</th>
              <th className="px-2 py-2">Statut</th>
              <th className="px-2 py-2 text-right w-[150px]">Ce que vous touchez</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr key={ligne.localId} className="border-t border-noir/10">
                <td className="px-2 py-1.5">
                  <Vignette
                    ligne={ligne}
                    src={ligne.photoUrl ? urlsSignees[ligne.photoUrl] ?? null : null}
                    onLoupe={setLoupe}
                  />
                </td>
                <td className="px-2 py-1.5 text-noir">{ligne.description || "—"}</td>
                <td className="px-2 py-1.5 text-gris-moyen">{ligne.marque || "—"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gris-moyen">
                  {saisitSonPlancher && !ligne.prixValidesLe ? (
                    <Input
                      value={ligne.prixMin}
                      onChange={(e) => majLocale(ligne.localId, { prixMin: e.target.value })}
                      onBlur={() => void enregistrerPrixMin(ligne)}
                      inputMode="decimal"
                      placeholder="—"
                      className="h-8 w-[84px] border-noir/15 bg-transparent px-2 text-right tabular-nums text-sm"
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {ligne.prixValidesLe && <Lock className="h-3 w-3" />}
                      {versPrix(ligne.prixMin) != null
                        ? euros(versPrix(ligne.prixMin) as number)
                        : "—"}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <Pastille statut={ligne.statut} pour="client" />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <PartCliente ligne={ligne} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        {lignes.map((ligne) => (
          <div key={ligne.localId} className="flex gap-3 border border-noir/10 bg-blanc p-3">
            <Vignette
              ligne={ligne}
              src={ligne.photoUrl ? urlsSignees[ligne.photoUrl] ?? null : null}
              onLoupe={setLoupe}
              taille="h-14 w-14"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-noir">{ligne.description || "Pièce"}</p>
              {ligne.marque && <p className="text-xs text-gris-moyen">{ligne.marque}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Pastille statut={ligne.statut} pour="client" />
                <PartCliente ligne={ligne} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Loupe src={loupe?.src ?? null} legende={loupe?.legende} onClose={() => setLoupe(null)} />
    </div>
  );
}

// ===========================================================================
// Phrase de synthèse
// ===========================================================================

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

// ===========================================================================
// Vignette
// ===========================================================================

function Vignette({
  ligne,
  src,
  onLoupe,
  taille = "h-12 w-12",
}: {
  ligne: Ligne;
  src: string | null;
  onLoupe: (v: { src: string; legende: string }) => void;
  taille?: string;
}) {
  if (!src) {
    return <div className={`${taille} shrink-0 border border-dashed border-noir/15`} />;
  }
  return (
    <button
      type="button"
      onClick={() => onLoupe({ src, legende: ligne.description || ligne.marque || "Pièce" })}
      className="shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={ligne.description || "Pièce"}
        className={`${taille} object-cover border border-noir/10`}
      />
    </button>
  );
}

export default InventaireCliente;
