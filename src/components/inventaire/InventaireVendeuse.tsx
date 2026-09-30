"use client";

// Inventaire d'une demande, côté vendeuse : un tableau dense, triable et
// filtrable, plutôt qu'une pile de cartes. Au-delà d'une dizaine de pièces,
// c'est la seule façon de comparer les prix et de voir où en est la commande.
//
// Ce que le composant ne décide pas : les règles d'écriture (prix verrouillés,
// finalisation, qui a le droit de quoi) vivent dans le trigger
// request_items_pricing_guard (migration 0024). L'interface se contente de ne
// pas proposer ce qui sera refusé, et de remonter tel quel le message de la
// base quand elle refuse quand même.

import { useCallback, useMemo, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  ExternalLink,
  ImageIcon,
  Loader2,
  Lock,
  Mic,
  Paperclip,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { detecterMarque } from "@/lib/brands";
import { minPriceEditorFor } from "@/lib/formules";
import {
  ORDRE_STATUTS,
  STATUTS,
  estVendue,
  estVerrouille,
  statutsProposables,
} from "@/lib/item-status";
import {
  PART_CLIENTE,
  PART_PLATEFORME,
  PART_VENDEUSE,
  formatShare,
  montantCliente,
  montantPlateforme,
  montantVendeuse,
} from "@/lib/pricing";
import type { ItemStatus } from "@/types/database";
import {
  Loupe,
  Pastille,
  euros,
  jour,
  ligneDepuisRow,
  useInventaire,
  versPrix,
  type Ligne,
} from "./commun";

type Colonne = "description" | "marque" | "prixDepart" | "prixMin" | "statut" | "prixVente";

interface Props {
  requestId: string;
  /** Slug de la formule : décide qui saisit le prix minimal. */
  formulaSlug?: string | null;
  onItemsChange?: () => void;
}

const CELLULE = "px-2 py-1.5 align-middle";
const CHAMP_PRIX =
  "h-8 w-[74px] px-2 text-right tabular-nums text-sm border-noir/15 bg-transparent";

export function InventaireVendeuse({ requestId, formulaSlug, onItemsChange }: Props) {
  const { toast } = useToast();
  // Formule « Déjà trié » : c'est la cliente qui fixe son plancher.
  const prixMinEditable = minPriceEditorFor(formulaSlug) === "seller";
  const { lignes, setLignes, chargement, urlsSignees, supabase } = useInventaire(requestId);

  const inputPhotos = useRef<HTMLInputElement>(null);
  const [tri, setTri] = useState<{ colonne: Colonne; sens: 1 | -1 } | null>(null);
  const [filtre, setFiltre] = useState<ItemStatus | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [notesOuvertes, setNotesOuvertes] = useState<string | null>(null);
  const [loupe, setLoupe] = useState<{ src: string; legende: string } | null>(null);
  const [aFinaliser, setAFinaliser] = useState<Ligne | null>(null);

  // -------------------------------------------------------------------------
  // Écritures
  // -------------------------------------------------------------------------

  const majLocale = useCallback(
    (localId: string, patch: Partial<Ligne>) =>
      setLignes((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...patch } : l))),
    [setLignes]
  );

  /** Écrit en base. Le message d'erreur du trigger est montré tel quel. */
  const ecrire = useCallback(
    async (itemId: string, patch: Record<string, unknown>): Promise<boolean> => {
      const { error } = await supabase.from("request_items").update(patch).eq("id", itemId);
      if (error) {
        toast({ title: "Modification refusée", description: error.message, variant: "destructive" });
        return false;
      }
      onItemsChange?.();
      return true;
    },
    [supabase, toast, onItemsChange]
  );

  const ajouterLigneVide = useCallback(async () => {
    const { data, error } = await supabase
      .from("request_items")
      .insert([{ request_id: requestId }])
      .select("*")
      .single();
    if (error || !data) {
      toast({ title: "Erreur", description: error?.message ?? "Ajout impossible.", variant: "destructive" });
      return;
    }
    setLignes((prev) => [...prev, ligneDepuisRow(data)]);
    onItemsChange?.();
  }, [requestId, supabase, setLignes, toast, onItemsChange]);

  const ajouterPhotos = useCallback(
    async (fichiers: FileList | null) => {
      if (!fichiers || fichiers.length === 0) return;
      const liste = Array.from(fichiers);

      const brouillons: Ligne[] = liste.map((f) => ({
        localId: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2)}`,
        photoUrl: null,
        description: "",
        marque: "",
        statut: "photos_taken" as ItemStatus,
        prixMin: "",
        prixValidesLe: null,
        prixDepart: "",
        prixVente: "",
        preuveUrl: null,
        venduLe: null,
        finaliseeLe: null,
        notes: "",
        uploading: true,
        uploadingPreuve: false,
      }));
      setLignes((prev) => [...prev, ...brouillons]);

      for (let i = 0; i < liste.length; i++) {
        const fichier = liste[i];
        const brouillon = brouillons[i];
        const ext = fichier.name.split(".").pop() || "jpg";
        const chemin = `${requestId}/${brouillon.localId}.${ext}`;

        const { error: erreurUpload } = await supabase.storage
          .from("request-items")
          .upload(chemin, fichier, { contentType: fichier.type });
        if (erreurUpload) {
          majLocale(brouillon.localId, { uploading: false });
          toast({ title: "Photo refusée", description: erreurUpload.message, variant: "destructive" });
          continue;
        }

        const { data, error } = await supabase
          .from("request_items")
          .insert([{ request_id: requestId, photo_url: chemin }])
          .select("id")
          .single();
        majLocale(brouillon.localId, {
          photoUrl: chemin,
          uploading: false,
          itemId: error ? undefined : (data as { id: string }).id,
        });
      }
      onItemsChange?.();
    },
    [requestId, supabase, setLignes, majLocale, toast, onItemsChange]
  );

  /** Remplace la photo d'une ligne existante. */
  const remplacerPhoto = useCallback(
    async (ligne: Ligne, fichier: File | null) => {
      if (!fichier || !ligne.itemId) return;
      majLocale(ligne.localId, { uploading: true });
      const ext = fichier.name.split(".").pop() || "jpg";
      const chemin = `${requestId}/${ligne.itemId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("request-items")
        .upload(chemin, fichier, { contentType: fichier.type });
      if (error) {
        majLocale(ligne.localId, { uploading: false });
        toast({ title: "Photo refusée", description: error.message, variant: "destructive" });
        return;
      }
      const ok = await ecrire(ligne.itemId, { photo_url: chemin });
      majLocale(ligne.localId, { uploading: false, photoUrl: ok ? chemin : ligne.photoUrl });
    },
    [requestId, supabase, majLocale, ecrire, toast]
  );

  const supprimer = useCallback(
    async (ligne: Ligne) => {
      if (ligne.itemId) {
        const { error } = await supabase.from("request_items").delete().eq("id", ligne.itemId);
        if (error) {
          toast({ title: "Suppression refusée", description: error.message, variant: "destructive" });
          return;
        }
      }
      setLignes((prev) => prev.filter((l) => l.localId !== ligne.localId));
      onItemsChange?.();
    },
    [supabase, setLignes, toast, onItemsChange]
  );

  /**
   * Sortie de la case Description : on enregistre, et on propose une marque
   * si la colonne est encore vide. On n'écrase jamais ce qui a été saisi.
   */
  const enregistrerDescription = useCallback(
    async (ligne: Ligne, texte?: string) => {
      if (!ligne.itemId) return;
      // `texte` est fourni par la dictée : la description du state n'est pas
      // encore à jour au moment où la reconnaissance vocale rend son résultat.
      const description = texte ?? ligne.description;
      const patch: Record<string, unknown> = { description: description || null };
      const devinee = ligne.marque.trim() === "" ? detecterMarque(description) : null;
      if (devinee) {
        patch.brand = devinee;
        majLocale(ligne.localId, { marque: devinee });
      }
      await ecrire(ligne.itemId, patch);
    },
    [ecrire, majLocale]
  );

  const enregistrerPrix = useCallback(
    async (ligne: Ligne, champ: "min_price" | "starting_price" | "sale_price", valeur: string) => {
      if (!ligne.itemId) return;
      await ecrire(ligne.itemId, { [champ]: versPrix(valeur) });
    },
    [ecrire]
  );

  const changerStatut = useCallback(
    async (ligne: Ligne, statut: ItemStatus) => {
      if (!ligne.itemId) return;
      const ok = await ecrire(ligne.itemId, { status: statut });
      if (!ok) return;
      majLocale(ligne.localId, {
        statut,
        venduLe: statut === "sold" ? ligne.venduLe ?? new Date().toISOString() : null,
      });
      // « Invendable » sans explication ne sert à personne : on ouvre les
      // notes tout de suite plutôt que de bloquer le changement de statut.
      if (statut === "unsellable") setNotesOuvertes(ligne.localId);
    },
    [ecrire, majLocale]
  );

  /** Bouton « Vendu » : le prix de vente est la seule condition. */
  const marquerVendue = useCallback(
    async (ligne: Ligne) => {
      if (!ligne.itemId) return;
      const prix = versPrix(ligne.prixVente);
      if (prix == null || prix <= 0) {
        toast({
          title: "Prix de vente manquant",
          description: "Renseignez le prix de vente avant de marquer la pièce vendue.",
          variant: "destructive",
        });
        return;
      }
      const ok = await ecrire(ligne.itemId, { sale_price: prix, status: "sold" });
      if (ok) {
        majLocale(ligne.localId, { statut: "sold", venduLe: new Date().toISOString() });
      }
    },
    [ecrire, majLocale, toast]
  );

  const deposerPreuve = useCallback(
    async (ligne: Ligne, fichier: File | null) => {
      if (!fichier || !ligne.itemId) return;
      majLocale(ligne.localId, { uploadingPreuve: true });
      const ext = fichier.name.split(".").pop() || "jpg";
      const chemin = `${requestId}/${ligne.itemId}-preuve-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("sale-proofs")
        .upload(chemin, fichier, { contentType: fichier.type });
      if (error) {
        majLocale(ligne.localId, { uploadingPreuve: false });
        toast({ title: "Justificatif refusé", description: error.message, variant: "destructive" });
        return;
      }
      const ok = await ecrire(ligne.itemId, { sale_proof_url: chemin });
      majLocale(ligne.localId, {
        uploadingPreuve: false,
        preuveUrl: ok ? chemin : ligne.preuveUrl,
      });
      // Déposer le justificatif, c'est dire « la cliente a été payée ». On
      // enchaîne donc sur la finalisation — mais en la faisant confirmer :
      // après elle, la ligne est verrouillée définitivement.
      if (ok && estVendue(ligne.statut)) {
        setAFinaliser({ ...ligne, preuveUrl: chemin, uploadingPreuve: false });
      }
    },
    [requestId, supabase, majLocale, ecrire, toast]
  );

  const finaliser = useCallback(
    async (ligne: Ligne) => {
      if (!ligne.itemId) return;
      const ok = await ecrire(ligne.itemId, { status: "finalized" });
      if (!ok) return;
      majLocale(ligne.localId, { statut: "finalized", finaliseeLe: new Date().toISOString() });
      setAFinaliser(null);
      toast({
        title: "Pièce finalisée",
        description: "La ligne est verrouillée : la cliente a été payée.",
      });
    },
    [ecrire, majLocale, toast]
  );

  // -------------------------------------------------------------------------
  // Tri, filtre, recherche
  // -------------------------------------------------------------------------

  const basculerTri = (colonne: Colonne) =>
    setTri((prev) =>
      prev?.colonne === colonne
        ? prev.sens === 1
          ? { colonne, sens: -1 }
          : null
        : { colonne, sens: 1 }
    );

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let sortie = lignes.filter((l) => {
      if (filtre !== "tous" && l.statut !== filtre) return false;
      if (!q) return true;
      return (
        l.description.toLowerCase().includes(q) || l.marque.toLowerCase().includes(q)
      );
    });

    if (tri) {
      const cle = (l: Ligne): string | number => {
        switch (tri.colonne) {
          case "description":
            return l.description.toLowerCase();
          case "marque":
            return l.marque.toLowerCase();
          case "prixMin":
            return versPrix(l.prixMin) ?? -1;
          case "prixDepart":
            return versPrix(l.prixDepart) ?? -1;
          case "prixVente":
            return versPrix(l.prixVente) ?? -1;
          case "statut":
            return ORDRE_STATUTS.indexOf(l.statut);
        }
      };
      sortie = [...sortie].sort((a, b) => {
        const x = cle(a);
        const y = cle(b);
        if (x === y) return 0;
        return (x < y ? -1 : 1) * tri.sens;
      });
    }
    return sortie;
  }, [lignes, filtre, recherche, tri]);

  // -------------------------------------------------------------------------
  // Totaux — toujours via pricing.ts, jamais de pourcentage en dur
  // -------------------------------------------------------------------------

  const totaux = useMemo(() => {
    const prix = (l: Ligne) => versPrix(l.prixVente) ?? 0;
    const vendues = lignes.filter((l) => estVendue(l.statut));
    const finalisees = lignes.filter((l) => l.statut === "finalized");
    const montantVendu = vendues.reduce((s, l) => s + prix(l), 0);
    const montantFinalise = finalisees.reduce((s, l) => s + prix(l), 0);
    return {
      nbVendues: vendues.length,
      nbFinalisees: finalisees.length,
      montantVendu,
      montantFinalise,
      enCours: montantVendu - montantFinalise,
    };
  }, [lignes]);

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------

  const nbParStatut = useMemo(() => {
    const compte = {} as Record<ItemStatus, number>;
    ORDRE_STATUTS.forEach((s) => (compte[s] = 0));
    lignes.forEach((l) => (compte[l.statut] = (compte[l.statut] ?? 0) + 1));
    return compte;
  }, [lignes]);

  return (
    <div className="mt-4 space-y-3">
      {/* ---------------- Barre d'outils ---------------- */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h4 className="font-serif text-xl leading-none text-noir">Inventaire</h4>
        <span className="text-sm text-gris-moyen">
          {lignes.length} {lignes.length > 1 ? "pièces" : "pièce"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputPhotos.current?.click()}
          className="ml-auto"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          Importer des photos
        </Button>
        <input
          ref={inputPhotos}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void ajouterPhotos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* La recherche a sa propre ligne, sur toute la largeur : coincée entre
          deux boutons, on ne la voyait pas. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-moyen" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une pièce, une marque…"
          className="h-10 w-full pl-9 text-sm"
        />
      </div>

      {/* ---------------- Filtres ---------------- */}
      {lignes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FiltreBouton actif={filtre === "tous"} onClick={() => setFiltre("tous")}>
            Toutes ({lignes.length})
          </FiltreBouton>
          {ORDRE_STATUTS.filter((s) => nbParStatut[s] > 0).map((s) => (
            <FiltreBouton key={s} actif={filtre === s} onClick={() => setFiltre(s)}>
              {STATUTS[s].label} ({nbParStatut[s]})
            </FiltreBouton>
          ))}
        </div>
      )}

      {/* ---------------- Totaux ---------------- */}
      {totaux.nbVendues > 0 && (
        <Totaux
          nbVendues={totaux.nbVendues}
          nbFinalisees={totaux.nbFinalisees}
          montantVendu={totaux.montantVendu}
          montantFinalise={totaux.montantFinalise}
          enCours={totaux.enCours}
        />
      )}

      {/* ---------------- Tableau ---------------- */}
      {chargement ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : lignes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune pièce. Importez les photos d&apos;un coup, ou ajoutez les lignes une à une
          et photographiez plus tard.
        </p>
      ) : (
        <>
          {/* Écran large : le tableau */}
          <div className="hidden lg:block overflow-x-auto border border-noir/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gris-tres-clair text-left text-[11px] uppercase tracking-[0.12em] text-gris-moyen">
                  <th className="px-2 py-2 w-[64px]">Photo</th>
                  <EnTete colonne="description" tri={tri} onClick={basculerTri}>
                    Description
                  </EnTete>
                  <EnTete colonne="marque" tri={tri} onClick={basculerTri}>
                    Marque
                  </EnTete>
                  <EnTete colonne="prixDepart" tri={tri} onClick={basculerTri} droite>
                    Prix départ
                  </EnTete>
                  <EnTete colonne="prixMin" tri={tri} onClick={basculerTri} droite>
                    Prix min
                  </EnTete>
                  <EnTete colonne="statut" tri={tri} onClick={basculerTri}>
                    Statut
                  </EnTete>
                  <EnTete colonne="prixVente" tri={tri} onClick={basculerTri} droite>
                    Prix vente
                  </EnTete>
                  <th className="px-2 py-2 w-[92px]">Vendu</th>
                  <th className="px-2 py-2 w-[128px]">Preuve de vente</th>
                  <th className="px-2 py-2 w-[44px]">Notes</th>
                  <th className="px-2 py-2 w-[44px]"></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((ligne) => (
                  <LigneTableau
                    key={ligne.localId}
                    ligne={ligne}
                    prixMinEditable={prixMinEditable}
                    photoSrc={ligne.photoUrl ? urlsSignees[ligne.photoUrl] ?? null : null}
                    preuveHref={ligne.preuveUrl ? urlsSignees[ligne.preuveUrl] ?? null : null}
                    notesOuvertes={notesOuvertes === ligne.localId}
                    onToggleNotes={() =>
                      setNotesOuvertes((prev) => (prev === ligne.localId ? null : ligne.localId))
                    }
                    onChange={(patch) => majLocale(ligne.localId, patch)}
                    onEnregistrerDescription={(texte) =>
                      void enregistrerDescription(ligne, texte)
                    }
                    onEnregistrerMarque={() =>
                      ligne.itemId && void ecrire(ligne.itemId, { brand: ligne.marque || null })
                    }
                    onEnregistrerNotes={() =>
                      ligne.itemId && void ecrire(ligne.itemId, { notes: ligne.notes || null })
                    }
                    onEnregistrerPrix={(champ, valeur) => void enregistrerPrix(ligne, champ, valeur)}
                    onStatut={(s) => void changerStatut(ligne, s)}
                    onVendue={() => void marquerVendue(ligne)}
                    onPhoto={(f) => void remplacerPhoto(ligne, f)}
                    onPreuve={(f) => void deposerPreuve(ligne, f)}
                    onSupprimer={() => void supprimer(ligne)}
                    onLoupe={(src) =>
                      setLoupe({ src, legende: ligne.description || ligne.marque || "Pièce" })
                    }
                  />
                ))}
                <tr className="border-t border-noir/10">
                  <td colSpan={11} className="p-0">
                    <button
                      type="button"
                      onClick={ajouterLigneVide}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gris-moyen transition-colors hover:bg-gris-tres-clair hover:text-noir"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une pièce
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile et tablette : une liste compacte, deux lignes par pièce */}
          <div className="lg:hidden space-y-2">
            {visibles.map((ligne) => (
              <CarteCompacte
                key={ligne.localId}
                ligne={ligne}
                prixMinEditable={prixMinEditable}
                photoSrc={ligne.photoUrl ? urlsSignees[ligne.photoUrl] ?? null : null}
                preuveHref={ligne.preuveUrl ? urlsSignees[ligne.preuveUrl] ?? null : null}
                onChange={(patch) => majLocale(ligne.localId, patch)}
                onEnregistrerDescription={(texte) => void enregistrerDescription(ligne, texte)}
                onEnregistrerMarque={() =>
                  ligne.itemId && void ecrire(ligne.itemId, { brand: ligne.marque || null })
                }
                onEnregistrerNotes={() =>
                  ligne.itemId && void ecrire(ligne.itemId, { notes: ligne.notes || null })
                }
                onEnregistrerPrix={(champ, valeur) => void enregistrerPrix(ligne, champ, valeur)}
                onStatut={(s) => void changerStatut(ligne, s)}
                onVendue={() => void marquerVendue(ligne)}
                onPreuve={(f) => void deposerPreuve(ligne, f)}
                onSupprimer={() => void supprimer(ligne)}
                onLoupe={(src) =>
                  setLoupe({ src, legende: ligne.description || ligne.marque || "Pièce" })
                }
              />
            ))}
            <button
              type="button"
              onClick={ajouterLigneVide}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-noir/20 p-3 text-sm text-gris-moyen transition-colors hover:border-noir/50 hover:text-noir"
            >
              <Plus className="h-4 w-4" />
              Ajouter une pièce
            </button>
          </div>

          {visibles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune pièce ne correspond à ce filtre.
            </p>
          )}
        </>
      )}

      <Loupe src={loupe?.src ?? null} legende={loupe?.legende} onClose={() => setLoupe(null)} />

      <DialogueFinalisation
        ligne={aFinaliser}
        preuveHref={
          aFinaliser?.preuveUrl ? urlsSignees[aFinaliser.preuveUrl] ?? null : null
        }
        onPreuve={(f) => aFinaliser && void deposerPreuve(aFinaliser, f)}
        onAnnuler={() => setAFinaliser(null)}
        onConfirmer={() => aFinaliser && void finaliser(aFinaliser)}
      />
    </div>
  );
}

// ===========================================================================
// Barre de totaux
// ===========================================================================

function Totaux({
  nbVendues,
  nbFinalisees,
  montantVendu,
  montantFinalise,
  enCours,
}: {
  nbVendues: number;
  nbFinalisees: number;
  montantVendu: number;
  montantFinalise: number;
  enCours: number;
}) {
  return (
    <div className="border border-noir/10 bg-gris-tres-clair p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
        <Chiffre
          libelle="Montant vendu"
          valeur={euros(montantVendu)}
          detail={`${nbVendues} pièce${nbVendues > 1 ? "s" : ""}`}
        />
        <Chiffre
          libelle="Montant finalisé"
          valeur={euros(montantFinalise)}
          detail={`${nbFinalisees} pièce${nbFinalisees > 1 ? "s" : ""} payée${nbFinalisees > 1 ? "s" : ""}`}
        />
        <Chiffre
          libelle={`Part cliente (${formatShare(PART_CLIENTE)})`}
          valeur={euros(montantCliente(montantFinalise))}
        />
        <Chiffre
          libelle={`Part vendeuse (${formatShare(PART_VENDEUSE)})`}
          valeur={euros(montantVendeuse(montantFinalise))}
        />
        <Chiffre
          libelle={`Part Seconde (${formatShare(PART_PLATEFORME)})`}
          valeur={euros(montantPlateforme(montantFinalise))}
        />
      </div>
      {enCours > 0 && (
        <p className="mt-3 border-t border-noir/10 pt-2 text-xs text-gris-moyen">
          {euros(enCours)} sont vendus mais pas encore finalisés : la répartition ne les compte
          pas tant que la cliente n&apos;a pas été virée.
        </p>
      )}
    </div>
  );
}

function Chiffre({
  libelle,
  valeur,
  detail,
}: {
  libelle: string;
  valeur: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-gris-moyen">{libelle}</span>
      <span className="font-serif text-xl leading-none tabular-nums text-noir">{valeur}</span>
      {detail && <span className="text-[11px] text-gris-moyen">{detail}</span>}
    </div>
  );
}

// ===========================================================================
// En-tête triable
// ===========================================================================

function EnTete({
  colonne,
  tri,
  onClick,
  droite = false,
  children,
}: {
  colonne: Colonne;
  tri: { colonne: Colonne; sens: 1 | -1 } | null;
  onClick: (c: Colonne) => void;
  droite?: boolean;
  children: React.ReactNode;
}) {
  const actif = tri?.colonne === colonne;
  const Icone = !actif ? ChevronsUpDown : tri.sens === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-2 py-2 ${droite ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onClick(colonne)}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-noir ${
          actif ? "text-noir" : ""
        } ${droite ? "flex-row-reverse" : ""}`}
      >
        {children}
        <Icone className={`h-3 w-3 ${actif ? "opacity-100" : "opacity-40"}`} />
      </button>
    </th>
  );
}

function FiltreBouton({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2.5 py-1 text-xs transition-colors ${
        actif
          ? "border-noir bg-noir text-blanc"
          : "border-noir/15 text-gris-moyen hover:border-noir/40 hover:text-noir"
      }`}
    >
      {children}
    </button>
  );
}

// ===========================================================================
// Une ligne du tableau
// ===========================================================================

interface LigneProps {
  ligne: Ligne;
  /** Faux quand c'est la cliente qui fixe le prix minimal (formule « Déjà trié »). */
  prixMinEditable: boolean;
  photoSrc: string | null;
  preuveHref: string | null;
  onChange: (patch: Partial<Ligne>) => void;
  /** Le texte est passé explicitement : la dictée arrive après le rendu. */
  onEnregistrerDescription: (texte?: string) => void;
  onEnregistrerMarque: () => void;
  onEnregistrerNotes: () => void;
  onEnregistrerPrix: (champ: "min_price" | "starting_price" | "sale_price", valeur: string) => void;
  onStatut: (s: ItemStatus) => void;
  onVendue: () => void;
  onPreuve: (f: File | null) => void;
  onSupprimer: () => void;
  onLoupe: (src: string) => void;
}

function LigneTableau({
  ligne,
  prixMinEditable,
  photoSrc,
  preuveHref,
  notesOuvertes,
  onToggleNotes,
  onChange,
  onEnregistrerDescription,
  onEnregistrerMarque,
  onEnregistrerNotes,
  onEnregistrerPrix,
  onStatut,
  onVendue,
  onPhoto,
  onPreuve,
  onSupprimer,
  onLoupe,
}: LigneProps & {
  notesOuvertes: boolean;
  onToggleNotes: () => void;
  onPhoto: (f: File | null) => void;
}) {
  const verrouille = estVerrouille(ligne.statut);
  const prixBloques = !!ligne.prixValidesLe || !prixMinEditable;
  const inputPhoto = useRef<HTMLInputElement>(null);

  return (
    <>
      <tr
        className={`border-t border-noir/10 ${
          verrouille ? "bg-[#f4f7fa]" : "hover:bg-gris-tres-clair/60"
        }`}
      >
        {/* Photo */}
        <td className={CELLULE}>
          {ligne.uploading ? (
            <div className="flex h-12 w-12 items-center justify-center bg-gris-clair">
              <Loader2 className="h-4 w-4 animate-spin text-gris-moyen" />
            </div>
          ) : photoSrc ? (
            <button type="button" onClick={() => onLoupe(photoSrc)} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt={ligne.description || "Pièce"}
                className="h-12 w-12 object-cover border border-noir/10"
              />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => !verrouille && inputPhoto.current?.click()}
                disabled={verrouille}
                aria-label="Ajouter une photo"
                className="flex h-12 w-12 items-center justify-center border border-dashed border-noir/20 text-gris-moyen hover:border-noir/50 disabled:opacity-50"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <input
                ref={inputPhoto}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onPhoto(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </td>

        {/* Description */}
        <td className={CELLULE}>
          <ChampDescription
            valeur={ligne.description}
            verrouille={verrouille}
            onChange={(v) => onChange({ description: v })}
            onEnregistrer={onEnregistrerDescription}
          />
        </td>

        {/* Marque */}
        <td className={CELLULE}>
          <Input
            value={ligne.marque}
            onChange={(e) => onChange({ marque: e.target.value })}
            onBlur={onEnregistrerMarque}
            disabled={verrouille}
            placeholder=""
            className="h-8 w-[120px] border-noir/15 bg-transparent px-2 text-sm"
          />
        </td>

        {/* Prix départ */}
        <td className={`${CELLULE} text-right`}>
          <Input
            value={ligne.prixDepart}
            onChange={(e) => onChange({ prixDepart: e.target.value })}
            onBlur={() => onEnregistrerPrix("starting_price", ligne.prixDepart)}
            disabled={verrouille}
            inputMode="decimal"
            placeholder=""
            className={CHAMP_PRIX}
          />
        </td>

        {/* Prix min */}
        <td className={`${CELLULE} text-right`}>
          {prixBloques ? (
            <span className="inline-flex items-center justify-end gap-1 tabular-nums text-noir">
              {ligne.prixValidesLe && <Lock className="h-3 w-3 text-gris-moyen" />}
              {versPrix(ligne.prixMin) != null ? euros(versPrix(ligne.prixMin) as number) : "—"}
            </span>
          ) : (
            <Input
              value={ligne.prixMin}
              onChange={(e) => onChange({ prixMin: e.target.value })}
              onBlur={() => onEnregistrerPrix("min_price", ligne.prixMin)}
              inputMode="decimal"
              placeholder=""
              className={CHAMP_PRIX}
            />
          )}
        </td>

        {/* Statut */}
        <td className={CELLULE}>
          <ChoixStatut ligne={ligne} onStatut={onStatut} />
        </td>

        {/* Prix de vente */}
        <td className={`${CELLULE} text-right`}>
          {verrouille ? (
            <span className="tabular-nums text-noir">
              {versPrix(ligne.prixVente) != null ? euros(versPrix(ligne.prixVente) as number) : "—"}
            </span>
          ) : (
            <Input
              value={ligne.prixVente}
              onChange={(e) => onChange({ prixVente: e.target.value })}
              onBlur={() => onEnregistrerPrix("sale_price", ligne.prixVente)}
              inputMode="decimal"
              placeholder=""
              className={CHAMP_PRIX}
            />
          )}
        </td>

        {/* Vendu */}
        <td className={CELLULE}>
          <BoutonVendue ligne={ligne} onVendue={onVendue} />
        </td>

        {/* Preuve de vente */}
        <td className={CELLULE}>
          <ChampPreuve ligne={ligne} preuveHref={preuveHref} onPreuve={onPreuve} />
        </td>

        {/* Notes */}
        <td className={`${CELLULE} text-center`}>
          <button
            type="button"
            onClick={onToggleNotes}
            aria-label={ligne.notes ? "Voir les notes" : "Ajouter une note"}
            className={`p-1.5 transition-colors ${
              ligne.notes ? "text-sauge-fonce" : "text-gris-moyen hover:text-noir"
            }`}
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </td>

        {/* Suppression */}
        <td className={`${CELLULE} text-center`}>
          {!verrouille && (
            <button
              type="button"
              onClick={onSupprimer}
              aria-label="Supprimer la pièce"
              className="p-1.5 text-gris-moyen transition-colors hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </td>
      </tr>

      {notesOuvertes && (
        <tr className={verrouille ? "bg-[#f4f7fa]" : "bg-gris-tres-clair/60"}>
          <td colSpan={11} className="px-3 pb-3 pt-0">
            <Textarea
              value={ligne.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              onBlur={onEnregistrerNotes}
              disabled={verrouille}
              rows={2}
              autoFocus={ligne.statut === "unsellable" && !ligne.notes}
              placeholder={
                ligne.statut === "unsellable"
                  ? "Explique pourquoi cet article est invendable."
                  : "Tache sur la manche, taille petit, doublure décousue…"
              }
              className="resize-none border-noir/15 bg-blanc text-sm"
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ===========================================================================
// Description : champ texte + dictée
// ===========================================================================

/**
 * La dictée arrive de façon asynchrone, bien après le rendu. Si on se
 * contentait d'appeler l'enregistrement sans argument, il partirait avec la
 * description d'avant — c'est le texte dicté qu'on passe explicitement.
 */
function ChampDescription({
  valeur,
  verrouille,
  onChange,
  onEnregistrer,
}: {
  valeur: string;
  verrouille: boolean;
  onChange: (v: string) => void;
  onEnregistrer: (texte?: string) => void;
}) {
  const valeurRef = useRef(valeur);
  valeurRef.current = valeur;

  const { isListening, error, start, stop } = useSpeechRecognition({
    onResult: (texte) => {
      const complet = valeurRef.current ? `${valeurRef.current} ${texte}` : texte;
      onChange(complet);
      onEnregistrer(complet);
    },
  });

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onEnregistrer()}
        disabled={verrouille}
        placeholder=""
        className={`h-8 min-w-[160px] border-noir/15 bg-transparent px-2 text-sm ${
          isListening ? "border-sauge-fonce ring-1 ring-sauge-fonce/40" : ""
        }`}
      />
      {!verrouille && (
        <button
          type="button"
          onClick={() => (isListening ? stop() : start())}
          aria-label={isListening ? "Arrêter la dictée" : "Dicter la description"}
          title={error ?? (isListening ? "J'écoute… cliquez pour arrêter" : "Dicter")}
          className={`relative shrink-0 rounded-full p-1.5 transition-colors ${
            isListening
              ? "bg-sauge-fonce text-blanc"
              : "text-gris-moyen hover:bg-gris-clair hover:text-noir"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          {/* Anneau qui bat : on voit sans ambiguïté que le micro écoute. */}
          {isListening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-sauge-fonce/40" />
          )}
        </button>
      )}
      {isListening && (
        <span className="whitespace-nowrap text-[11px] text-sauge-fonce">J&apos;écoute…</span>
      )}
    </div>
  );
}

// ===========================================================================
// Statut, bouton Vendu, preuve de vente
// ===========================================================================

function ChoixStatut({
  ligne,
  onStatut,
}: {
  ligne: Ligne;
  onStatut: (s: ItemStatus) => void;
}) {
  // « Vendu » et « Finalisé » ne s'obtiennent pas par la liste : le premier
  // demande un prix, le second un justificatif. Ils s'affichent en pastille.
  if (ligne.statut === "finalized" || ligne.statut === "sold") {
    return (
      <div className="flex items-center gap-1.5">
        <Pastille statut={ligne.statut} />
        {ligne.statut === "sold" && (
          <button
            type="button"
            onClick={() => onStatut("on_sale")}
            title="Annuler la vente et remettre la pièce en vente"
            className="text-[11px] text-gris-moyen underline underline-offset-2 hover:text-noir"
          >
            annuler
          </button>
        )}
      </div>
    );
  }

  return (
    <Select
      value={ligne.statut}
      onChange={(e) => onStatut(e.target.value as ItemStatus)}
      className="h-8 w-[142px] border px-2 text-xs"
      style={{
        backgroundColor: STATUTS[ligne.statut].fond,
        color: STATUTS[ligne.statut].texte,
        borderColor: STATUTS[ligne.statut].bordure,
      }}
    >
      {statutsProposables(ligne.statut).map((s) => (
        <option key={s} value={s}>
          {STATUTS[s].label}
        </option>
      ))}
    </Select>
  );
}

function BoutonVendue({ ligne, onVendue }: { ligne: Ligne; onVendue: () => void }) {
  if (estVendue(ligne.statut)) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-[#3b5029]">
        <Check className="h-3.5 w-3.5" />
        {jour(ligne.venduLe) || "Vendue"}
      </span>
    );
  }

  const prix = versPrix(ligne.prixVente);
  const pret = prix != null && prix > 0;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onVendue}
      disabled={!pret}
      title={pret ? "Marquer la pièce vendue" : "Renseignez d'abord le prix de vente"}
      className="h-7 w-full px-2 text-[11px]"
    >
      Vendu
    </Button>
  );
}

/**
 * Le dépôt du justificatif est le geste qui finalise : c'est lui qui prouve
 * que la cliente a été payée. La confirmation qui suit n'est pas une
 * formalité — après elle, la ligne est verrouillée pour de bon.
 */
function ChampPreuve({
  ligne,
  preuveHref,
  onPreuve,
}: {
  ligne: Ligne;
  preuveHref: string | null;
  onPreuve: (f: File | null) => void;
}) {
  const inputPreuve = useRef<HTMLInputElement>(null);

  if (ligne.statut === "finalized") {
    return (
      <div className="flex flex-col gap-0.5 text-[11px]">
        <span className="inline-flex items-center gap-1 text-[#364a5c]">
          <Lock className="h-3 w-3" />
          Payée le {jour(ligne.finaliseeLe)}
        </span>
        {preuveHref && (
          <a
            href={preuveHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-gris-moyen underline underline-offset-2 hover:text-noir"
          >
            Justificatif <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  if (!estVendue(ligne.statut)) {
    return <span className="text-[11px] text-gris-moyen">—</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => inputPreuve.current?.click()}
        disabled={ligne.uploadingPreuve}
        className="h-7 px-2 text-[11px]"
      >
        {ligne.uploadingPreuve ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="mr-1 h-3.5 w-3.5" />
        )}
        {ligne.preuveUrl ? "Remplacer" : "Déposer"}
      </Button>
      <input
        ref={inputPreuve}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          onPreuve(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {preuveHref && (
        <a
          href={preuveHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Voir le justificatif"
          className="text-gris-moyen hover:text-noir"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}


// ===========================================================================
// Liste compacte (mobile et tablette)
// ===========================================================================

function CarteCompacte({
  ligne,
  prixMinEditable,
  photoSrc,
  preuveHref,
  onChange,
  onEnregistrerDescription,
  onEnregistrerMarque,
  onEnregistrerNotes,
  onEnregistrerPrix,
  onStatut,
  onVendue,
  onPreuve,
  onSupprimer,
  onLoupe,
}: LigneProps) {
  const verrouille = estVerrouille(ligne.statut);
  const prixBloques = !!ligne.prixValidesLe || !prixMinEditable;
  const [notesOuvertes, setNotesOuvertes] = useState(false);

  // Passer une pièce en invendable ouvre les notes : l'explication est
  // attendue tout de suite, pendant qu'on a la pièce en main.
  const changerStatut = (s: ItemStatus) => {
    onStatut(s);
    if (s === "unsellable") setNotesOuvertes(true);
  };

  return (
    <div className={`border border-noir/10 p-3 ${verrouille ? "bg-[#f4f7fa]" : "bg-blanc"}`}>
      <div className="flex gap-3">
        {photoSrc ? (
          <button type="button" onClick={() => onLoupe(photoSrc)} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt={ligne.description || "Pièce"}
              className="h-14 w-14 object-cover border border-noir/10"
            />
          </button>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-dashed border-noir/20 text-gris-moyen">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <ChampDescription
            valeur={ligne.description}
            verrouille={verrouille}
            onChange={(v) => onChange({ description: v })}
            onEnregistrer={onEnregistrerDescription}
          />
          <Input
            value={ligne.marque}
            onChange={(e) => onChange({ marque: e.target.value })}
            onBlur={onEnregistrerMarque}
            disabled={verrouille}
            placeholder="Marque"
            className="h-8 w-full border-noir/15 bg-transparent px-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Prix
          libelle="Prix départ"
          valeur={ligne.prixDepart}
          verrouille={verrouille}
          onChange={(v) => onChange({ prixDepart: v })}
          onBlur={() => onEnregistrerPrix("starting_price", ligne.prixDepart)}
        />
        <Prix
          libelle="Prix min"
          valeur={ligne.prixMin}
          verrouille={prixBloques}
          onChange={(v) => onChange({ prixMin: v })}
          onBlur={() => onEnregistrerPrix("min_price", ligne.prixMin)}
        />
        <Prix
          libelle="Prix vente"
          valeur={ligne.prixVente}
          verrouille={verrouille}
          onChange={(v) => onChange({ prixVente: v })}
          onBlur={() => onEnregistrerPrix("sale_price", ligne.prixVente)}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ChoixStatut ligne={ligne} onStatut={changerStatut} />
        <div className="w-[92px]">
          <BoutonVendue ligne={ligne} onVendue={onVendue} />
        </div>
        <ChampPreuve ligne={ligne} preuveHref={preuveHref} onPreuve={onPreuve} />

        <button
          type="button"
          onClick={() => setNotesOuvertes((v) => !v)}
          aria-label="Notes"
          className={`ml-auto p-1.5 ${ligne.notes ? "text-sauge-fonce" : "text-gris-moyen"}`}
        >
          <StickyNote className="h-4 w-4" />
        </button>
        {!verrouille && (
          <button
            type="button"
            onClick={onSupprimer}
            aria-label="Supprimer la pièce"
            className="p-1.5 text-gris-moyen transition-colors hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {notesOuvertes && (
        <Textarea
          value={ligne.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          onBlur={onEnregistrerNotes}
          disabled={verrouille}
          rows={2}
          autoFocus={ligne.statut === "unsellable" && !ligne.notes}
          placeholder={
            ligne.statut === "unsellable"
              ? "Explique pourquoi cet article est invendable."
              : "Tache sur la manche, taille petit…"
          }
          className="mt-2 resize-none border-noir/15 bg-blanc text-sm"
        />
      )}
    </div>
  );
}


function Prix({
  libelle,
  valeur,
  verrouille,
  onChange,
  onBlur,
}: {
  libelle: string;
  valeur: string;
  verrouille: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.12em] text-gris-moyen">{libelle}</span>
      {verrouille ? (
        <span className="flex h-8 items-center gap-1 px-2 tabular-nums text-sm text-noir">
          <Lock className="h-3 w-3 text-gris-moyen" />
          {versPrix(valeur) != null ? euros(versPrix(valeur) as number) : "—"}
        </span>
      ) : (
        <Input
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          inputMode="decimal"
          placeholder="—"
          className="h-8 w-full border-noir/15 bg-transparent px-2 text-right tabular-nums text-sm"
        />
      )}
    </label>
  );
}

// ===========================================================================
// Confirmation de finalisation
// ===========================================================================

function DialogueFinalisation({
  ligne,
  preuveHref,
  onPreuve,
  onAnnuler,
  onConfirmer,
}: {
  ligne: Ligne | null;
  preuveHref: string | null;
  onPreuve: (f: File | null) => void;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  const inputPreuve = useRef<HTMLInputElement>(null);
  const prix = ligne ? versPrix(ligne.prixVente) : null;
  const pret = !!ligne && prix != null && prix > 0 && !!ligne.preuveUrl;

  return (
    <AlertDialog.Root open={!!ligne} onOpenChange={(o) => !o && onAnnuler()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-noir/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-5 border border-noir/10 bg-blanc p-6 sm:p-8 focus:outline-none">
          <div className="space-y-2">
            <div className="eyebrow">Finalisation</div>
            <AlertDialog.Title className="font-serif text-2xl">
              Passer cette pièce en finalisé ?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gris-moyen">
              {ligne?.description || "Cette pièce"}
              {prix != null ? ` — vendue ${euros(prix)}.` : "."} La cliente touche{" "}
              <strong className="text-noir">{euros(montantCliente(prix ?? 0))}</strong> (
              {formatShare(PART_CLIENTE)}).
            </AlertDialog.Description>
          </div>

          <div className="space-y-2 border border-noir/10 bg-gris-tres-clair p-4">
            <span className="text-[10px] uppercase tracking-[0.14em] text-gris-moyen">
              Justificatif de virement
            </span>
            {ligne?.preuveUrl ? (
              <p className="text-sm text-noir">
                Bien reçu.{" "}
                {preuveHref && (
                  <a
                    href={preuveHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sauge-fonce underline underline-offset-2"
                  >
                    Le voir <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            ) : (
              <p className="text-sm text-gris-moyen">
                Aucun justificatif. Déposez la capture du virement pour pouvoir finaliser.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputPreuve.current?.click()}
              disabled={ligne?.uploadingPreuve}
            >
              {ligne?.uploadingPreuve ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="mr-2 h-4 w-4" />
              )}
              {ligne?.preuveUrl ? "Remplacer" : "Déposer"}
            </Button>
            <input
              ref={inputPreuve}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                onPreuve(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>

          <p className="border-l-2 border-[#8ba3b8] bg-[#f1f5f9] px-3 py-2 text-sm text-[#364a5c]">
            Une fois finalisée, cette pièce ne pourra plus être modifiée ni supprimée.
            C&apos;est de l&apos;argent déjà versé à la cliente.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline">
                Pas encore
              </Button>
            </AlertDialog.Cancel>
            <Button type="button" onClick={onConfirmer} disabled={!pret}>
              Finaliser
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default InventaireVendeuse;
