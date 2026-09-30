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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  ExternalLink,
  ImageIcon,
  Hourglass,
  Loader2,
  Lock,
  Mic,
  Paperclip,
  Plus,
  Search,
  Send,
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
  DELAI_VALIDATION_HEURES,
  ORDRE_STATUTS,
  STATUTS,
  attendLaCliente,
  estVendue,
  estVerrouille,
  statutsProposables,
} from "@/lib/item-status";
import {
  PART_CLIENTE,
  PART_VENDEUSE,
  formatShare,
  montantCliente,
  montantVendeuse,
} from "@/lib/pricing";
import type { ItemStatus } from "@/types/database";
import {
  Loupe,
  Pastille,
  euros,
  formaterDelai,
  heuresRestantes,
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

const CELLULE = "px-2 py-1.5 align-middle overflow-hidden";
/**
 * Entrée valide la saisie et quitte la case. On se contente de retirer le
 * focus : c'est la sortie du champ qui enregistre, partout dans ce tableau.
 */
function sortirSurEntree(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

/**
 * Première lettre en majuscule. La reconnaissance vocale rend tout en
 * minuscules : sans ça, une pièce dictée s'écrit « jupe ballon zara » à côté
 * d'une pièce tapée « Jupe ballon Zara ».
 */
function majusculeInitiale(texte: string): string {
  const propre = texte.trimStart();
  if (!propre) return texte;
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}

const CHAMP_PRIX =
  "h-8 w-full px-2 text-left tabular-nums text-sm border-noir/15 bg-transparent";

export function InventaireVendeuse({ requestId, formulaSlug, onItemsChange }: Props) {
  const { toast } = useToast();
  // Formule « Déjà trié » : la cliente a fait son inventaire et renseigne
  // elle-même ses planchers. La vendeuse peut quand même les saisir — sinon
  // elle se retrouve bloquée devant la cliente si rien n'a été rempli avant
  // son passage. Dans les deux cas, c'est la validation par la cliente qui
  // verrouille le prix.
  const clienteFixeLePlancher = minPriceEditorFor(formulaSlug) === "client";
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
        prixEnvoyesLe: null,
        noteCliente: "",
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
      // La fenêtre de finalisation reste ouverte : on lui rend la ligne à
      // jour pour qu'elle affiche le justificatif qu'on vient de déposer.
      if (ok) setAFinaliser((prev) => (prev?.localId === ligne.localId
        ? { ...prev, preuveUrl: chemin, uploadingPreuve: false }
        : prev));
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
        description: "La vente est finalisée, la ligne est verrouillée.",
      });
    },
    [ecrire, majLocale, toast]
  );

  // -------------------------------------------------------------------------
  // Envoi des prix à la cliente
  // -------------------------------------------------------------------------

  /** Une pièce est prête quand la cliente aurait de quoi juger le prix. */
  const pieceComplete = useCallback(
    (l: Ligne) =>
      !!l.photoUrl &&
      l.description.trim() !== "" &&
      l.marque.trim() !== "" &&
      versPrix(l.prixDepart) != null &&
      versPrix(l.prixMin) != null,
    []
  );

  const aSoumettre = useMemo(
    () => lignes.filter((l) => l.statut === "photos_taken"),
    [lignes]
  );
  const incompletes = useMemo(
    () => aSoumettre.filter((l) => !pieceComplete(l)),
    [aSoumettre, pieceComplete]
  );
  const enAttente = useMemo(
    () => lignes.filter((l) => attendLaCliente(l.statut)),
    [lignes]
  );

  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const envoyerLesPrix = useCallback(async () => {
    const ids = aSoumettre.map((l) => l.itemId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    setEnvoiEnCours(true);
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from("request_items")
      .update({ status: "awaiting_client" })
      .in("id", ids);
    setEnvoiEnCours(false);
    if (error) {
      toast({ title: "Envoi refusé", description: error.message, variant: "destructive" });
      return;
    }
    setLignes((prev) =>
      prev.map((l) =>
        ids.includes(l.itemId ?? "")
          ? { ...l, statut: "awaiting_client" as ItemStatus, prixEnvoyesLe: maintenant }
          : l
      )
    );
    onItemsChange?.();
    toast({
      title: "Prix envoyés",
      description: `${ids.length} pièce${ids.length > 1 ? "s" : ""} soumise${
        ids.length > 1 ? "s" : ""
      } à la cliente. Elle a ${DELAI_VALIDATION_HEURES} h pour répondre.`,
    });
  }, [aSoumettre, supabase, setLignes, toast, onItemsChange]);

  /**
   * Passé le délai, le silence vaut accord : les pièces partent en vente aux
   * prix proposés. Faute de tâche planifiée, la bascule se fait à l'ouverture
   * de l'écran — la base vérifie de son côté que le délai est bien écoulé.
   */
  const bascule = useRef(new Set<string>());
  useEffect(() => {
    const echues = lignes.filter(
      (l) =>
        l.itemId &&
        attendLaCliente(l.statut) &&
        heuresRestantes(l.prixEnvoyesLe, DELAI_VALIDATION_HEURES) === 0 &&
        !bascule.current.has(l.itemId)
    );
    if (echues.length === 0) return;
    const ids = echues.map((l) => l.itemId as string);
    ids.forEach((id) => bascule.current.add(id));

    (async () => {
      const { error } = await supabase
        .from("request_items")
        .update({ status: "on_sale" })
        .in("id", ids);
      if (error) return;
      setLignes((prev) =>
        prev.map((l) =>
          ids.includes(l.itemId ?? "") ? { ...l, statut: "on_sale" as ItemStatus } : l
        )
      );
      onItemsChange?.();
    })();
  }, [lignes, supabase, setLignes, onItemsChange]);

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

      {/* ---------------- Totaux ---------------- */}
      {totaux.nbVendues > 0 && (
        <Totaux
          nbFinalisees={totaux.nbFinalisees}
          montantFinalise={totaux.montantFinalise}
          enCours={totaux.enCours}
          nbEnCours={totaux.nbVendues - totaux.nbFinalisees}
        />
      )}

      {clienteFixeLePlancher && lignes.length > 0 && (
        <p className="text-xs text-gris-moyen">
          Formule <strong className="text-noir">Déjà trié</strong> : c&apos;est la cliente
          qui renseigne le prix minimal de chaque pièce. Vous pouvez le saisir à sa place,
          elle le validera — et il sera alors verrouillé.
        </p>
      )}

      {/* Filtrer et chercher sont le même geste : réduire ce qu'on voit dans
          le tableau. Les deux vivent donc sur une seule ligne, juste au-dessus
          des colonnes — filtres à gauche, recherche à droite. */}
      {lignes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
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

          <div className="relative ml-auto w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gris-moyen" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une pièce, une marque…"
              className="h-9 w-full pl-9 text-sm"
            />
          </div>
        </div>
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
          {/* Défilement vertical seulement. Aucune largeur minimale : c'est
              elle qui débordait, poussait la page au-delà de la fenêtre et
              décalait tout vers la gauche. Les colonnes sont en pourcentages,
              donc le tableau tient toujours dans la place disponible. */}
          <div className="hidden min-w-0 max-h-[70vh] lg:block overflow-y-auto overflow-x-hidden border border-noir/10">
            {/* table-fixed : les colonnes gardent leur largeur quoi qu'on
                saisisse. Sans ça, marquer une pièce vendue ajoutait une date
                et élargissait tout le tableau. */}
            <table className="w-full table-fixed border-collapse text-sm">
              {/* Réparti pour que chaque en-tête tienne sur une ligne sans
                  être tronqué, y compris « Minimum » et « Notes ». */}
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "11.5%" }} />
                <col style={{ width: "8.5%" }} />
                <col style={{ width: "8.5%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8.5%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "4%" }} />
              </colgroup>
              {/* L'en-tête suit le défilement : au-delà de quelques lignes, on
                  ne sait plus si la colonne est le prix min ou le prix départ. */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-gris-tres-clair text-left align-middle text-[11px] uppercase tracking-[0.08em] text-gris-moyen shadow-[0_1px_0_0_rgba(46,58,44,0.12)]">
                  <th className="px-2 py-2 whitespace-nowrap">Photo</th>
                  <EnTete colonne="description" tri={tri} onClick={basculerTri}>
                    Description
                  </EnTete>
                  <EnTete colonne="marque" tri={tri} onClick={basculerTri}>
                    Marque
                  </EnTete>
                  <EnTete
                    colonne="prixDepart"
                    tri={tri}
                    onClick={basculerTri}
                    titre="Prix de départ affiché en ligne"
                  >
                    Départ
                  </EnTete>
                  <EnTete
                    colonne="prixMin"
                    tri={tri}
                    onClick={basculerTri}
                    titre="Prix minimal accepté par la cliente"
                  >
                    Minimum
                  </EnTete>
                  <EnTete colonne="statut" tri={tri} onClick={basculerTri}>
                    Statut
                  </EnTete>
                  <EnTete
                    colonne="prixVente"
                    tri={tri}
                    onClick={basculerTri}
                    titre="Prix auquel la pièce a été vendue"
                  >
                    Vente
                  </EnTete>
                  <th className="px-2 py-2 whitespace-nowrap">Vendu</th>
                  <th className="px-2 py-2 whitespace-nowrap" title="Preuve de vente">
                    Preuve
                  </th>
                  <th className="px-2 py-2 whitespace-nowrap">Notes</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((ligne) => (
                  <LigneTableau
                    key={ligne.localId}
                    ligne={ligne}
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
                    onFinaliser={() => setAFinaliser(ligne)}
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
                onFinaliser={() => setAFinaliser(ligne)}
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

      {/* Envoi des prix : le geste qui fait passer l'inventaire de la
          vendeuse à la cliente. Il reste visible pendant tout le remplissage,
          pour qu'on sache dès le début où l'on va. */}
      {(aSoumettre.length > 0 || enAttente.length > 0) && (
        <BandeauEnvoi
          aSoumettre={aSoumettre.length}
          incompletes={incompletes.length}
          enAttente={enAttente}
          envoi={envoiEnCours}
          onEnvoyer={() => void envoyerLesPrix()}
        />
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
// Envoi des prix à la cliente
// ===========================================================================

function BandeauEnvoi({
  aSoumettre,
  incompletes,
  enAttente,
  envoi,
  onEnvoyer,
}: {
  aSoumettre: number;
  incompletes: number;
  enAttente: Ligne[];
  envoi: boolean;
  onEnvoyer: () => void;
}) {
  // Le délai le plus court parmi les pièces en attente : c'est celui qui
  // décidera du prochain basculement.
  const restant = enAttente.reduce<number | null>((min, l) => {
    const h = heuresRestantes(l.prixEnvoyesLe, DELAI_VALIDATION_HEURES);
    if (h == null) return min;
    return min == null || h < min ? h : min;
  }, null);

  return (
    <div className="border border-noir/10 bg-gris-tres-clair p-4 space-y-3">
      {enAttente.length > 0 && (
        <p className="flex items-start gap-2 text-sm text-[#4c4663]">
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {enAttente.length} pièce{enAttente.length > 1 ? "s" : ""} en attente de la
            cliente.
            {restant != null && restant > 0 && (
              <> Il lui reste {formaterDelai(restant)} pour répondre.</>
            )}{" "}
            Sans réponse, les prix proposés s&apos;appliquent et la vente démarre.
          </span>
        </p>
      )}

      {aSoumettre > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] text-sm text-gris-moyen">
            {incompletes === 0 ? (
              <>
                {aSoumettre} pièce{aSoumettre > 1 ? "s" : ""} prête
                {aSoumettre > 1 ? "s" : ""}. La cliente aura{" "}
                {DELAI_VALIDATION_HEURES} h pour valider les prix ou les ajuster.
              </>
            ) : (
              <>
                {incompletes} pièce{incompletes > 1 ? "s" : ""} encore incomplète
                {incompletes > 1 ? "s" : ""} : il faut une photo, une description, une
                marque et les deux prix pour que la cliente puisse se prononcer.
              </>
            )}
          </div>
          <Button
            type="button"
            onClick={onEnvoyer}
            disabled={envoi || incompletes > 0}
            title={
              incompletes > 0
                ? "Complétez toutes les pièces avant d'envoyer"
                : "Soumettre les prix à la cliente"
            }
          >
            {envoi ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer les prix à la cliente
          </Button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Barre de totaux
// ===========================================================================

/**
 * Un seul montant, volontairement.
 *
 * Afficher côte à côte « montant vendu » et « montant finalisé » obligeait à
 * comprendre la différence avant de lire le chiffre. Le tableau n'annonce donc
 * que l'argent réellement encaissé, et mentionne le reste en une phrase.
 *
 * La part Seconde n'apparaît pas : c'est notre marge, pas une information
 * dont la vendeuse a besoin pour travailler.
 */
function Totaux({
  nbFinalisees,
  montantFinalise,
  enCours,
  nbEnCours,
}: {
  nbFinalisees: number;
  montantFinalise: number;
  enCours: number;
  nbEnCours: number;
}) {
  return (
    <div className="border border-noir/10 bg-gris-tres-clair p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
        <Chiffre
          libelle="Montant de la vente"
          valeur={euros(montantFinalise)}
          detail={`${nbFinalisees} pièce${nbFinalisees > 1 ? "s" : ""} encaissée${
            nbFinalisees > 1 ? "s" : ""
          }`}
        />
        <Chiffre
          libelle={`Part cliente (${formatShare(PART_CLIENTE)})`}
          valeur={euros(montantCliente(montantFinalise))}
        />
        <Chiffre
          libelle={`Part vendeuse (${formatShare(PART_VENDEUSE)})`}
          valeur={euros(montantVendeuse(montantFinalise))}
        />
      </div>
      {enCours > 0 && (
        <p className="mt-3 border-t border-noir/10 pt-2 text-xs text-gris-moyen">
          {nbEnCours} pièce{nbEnCours > 1 ? "s" : ""} vendue{nbEnCours > 1 ? "s" : ""} (
          {euros(enCours)}) attend{nbEnCours > 1 ? "ent" : ""} d&apos;être finalisée
          {nbEnCours > 1 ? "s" : ""}. Le montant ci-dessus ne les compte pas encore.
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

/**
 * En-tête de colonne triable.
 *
 * Toutes les colonnes sont alignées à gauche, y compris les prix : la
 * convention des tableurs (chiffres à droite) donnait, au milieu de huit
 * colonnes de texte, une ligne d'en-tête en dents de scie. La flèche est
 * toujours juste après le libellé, et le libellé ne passe jamais à la ligne —
 * d'où des intitulés courts, complétés par une infobulle.
 */
function EnTete({
  colonne,
  tri,
  onClick,
  titre,
  children,
}: {
  colonne: Colonne;
  tri: { colonne: Colonne; sens: 1 | -1 } | null;
  onClick: (c: Colonne) => void;
  titre?: string;
  children: React.ReactNode;
}) {
  const actif = tri?.colonne === colonne;
  const Icone = !actif ? ChevronsUpDown : tri.sens === 1 ? ArrowUp : ArrowDown;
  return (
    <th className="px-2 py-2 text-left">
      <button
        type="button"
        onClick={() => onClick(colonne)}
        title={titre}
        className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap uppercase tracking-[0.08em] transition-colors hover:text-noir ${
          actif ? "text-noir" : ""
        }`}
      >
        <span className="truncate">{children}</span>
        <Icone className={`h-3 w-3 shrink-0 ${actif ? "opacity-100" : "opacity-40"}`} />
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
  onFinaliser: () => void;
  onSupprimer: () => void;
  onLoupe: (src: string) => void;
}

function LigneTableau({
  ligne,
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
  onFinaliser,
  onSupprimer,
  onLoupe,
}: LigneProps & {
  notesOuvertes: boolean;
  onToggleNotes: () => void;
  onPhoto: (f: File | null) => void;
}) {
  const verrouille = estVerrouille(ligne.statut);
  const prixBloques = !!ligne.prixValidesLe;
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
            <div className="flex h-11 w-11 items-center justify-center bg-gris-clair">
              <Loader2 className="h-4 w-4 animate-spin text-gris-moyen" />
            </div>
          ) : photoSrc ? (
            <button type="button" onClick={() => onLoupe(photoSrc)} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt={ligne.description || "Pièce"}
                className="h-11 w-11 object-cover border border-noir/10"
              />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => !verrouille && inputPhoto.current?.click()}
                disabled={verrouille}
                aria-label="Ajouter une photo"
                className="flex h-11 w-11 items-center justify-center border border-dashed border-noir/20 text-gris-moyen hover:border-noir/50 disabled:opacity-50"
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
            onKeyDown={sortirSurEntree}
            disabled={verrouille}
            placeholder=""
            className="h-8 w-full border-noir/15 bg-transparent px-2 text-sm"
          />
        </td>

        {/* Prix départ */}
        <td className={CELLULE}>
          <Input
            value={ligne.prixDepart}
            onChange={(e) => onChange({ prixDepart: e.target.value })}
            onBlur={() => onEnregistrerPrix("starting_price", ligne.prixDepart)}
            onKeyDown={sortirSurEntree}
            disabled={verrouille}
            inputMode="decimal"
            placeholder=""
            className={CHAMP_PRIX}
          />
        </td>

        {/* Prix min */}
        <td className={CELLULE}>
          {prixBloques ? (
            <span className="inline-flex items-center gap-1 px-2 tabular-nums text-noir">
              {ligne.prixValidesLe && <Lock className="h-3 w-3 text-gris-moyen" />}
              {versPrix(ligne.prixMin) != null ? euros(versPrix(ligne.prixMin) as number) : "—"}
            </span>
          ) : (
            <Input
              value={ligne.prixMin}
              onChange={(e) => onChange({ prixMin: e.target.value })}
              onBlur={() => onEnregistrerPrix("min_price", ligne.prixMin)}
              onKeyDown={sortirSurEntree}
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
        <td className={CELLULE}>
          {verrouille ? (
            <span className="px-2 tabular-nums text-noir">
              {versPrix(ligne.prixVente) != null ? euros(versPrix(ligne.prixVente) as number) : "—"}
            </span>
          ) : (
            <Input
              value={ligne.prixVente}
              onChange={(e) => onChange({ prixVente: e.target.value })}
              onBlur={() => onEnregistrerPrix("sale_price", ligne.prixVente)}
              onKeyDown={sortirSurEntree}
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
          <ChampPreuve ligne={ligne} preuveHref={preuveHref} onFinaliser={onFinaliser} />
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
          <td colSpan={11} className="px-3 pb-3 pt-0 space-y-2">
            {ligne.noteCliente && (
              <p className="border-l-2 border-[#b3aacb] bg-[#f3f1f7] px-3 py-2 text-sm text-[#4c4663]">
                <span className="text-[10px] uppercase tracking-[0.14em]">
                  Remarque de la cliente
                </span>
                <br />
                {ligne.noteCliente}
              </p>
            )}
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
      const complet = majusculeInitiale(
        valeurRef.current ? `${valeurRef.current} ${texte}` : texte
      );
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
        onKeyDown={sortirSurEntree}
        disabled={verrouille}
        placeholder=""
        className={`h-8 w-full min-w-0 border-noir/15 bg-transparent px-2 text-sm ${
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
  // Trois états ne s'obtiennent pas par la liste : « En attente de la
  // cliente » vient de l'envoi des prix, « Vendu » d'un prix de vente,
  // « Finalisé » d'une preuve. Ils s'affichent en pastille.
  if (statutsProposables(ligne.statut).length === 0) {
    const restant =
      ligne.statut === "awaiting_client"
        ? heuresRestantes(ligne.prixEnvoyesLe, DELAI_VALIDATION_HEURES)
        : null;
    return (
      <div className="flex flex-col items-start gap-0.5">
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
        {ligne.statut === "awaiting_client" && (
          <span className="text-[11px] text-gris-moyen">
            {restant != null && restant > 0 ? `reste ${formaterDelai(restant)}` : "délai écoulé"}
          </span>
        )}
      </div>
    );
  }

  return (
    <Select
      value={ligne.statut}
      onChange={(e) => onStatut(e.target.value as ItemStatus)}
      className="h-8 w-full border px-2 py-0 text-xs"
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
      <span className="flex flex-wrap items-center gap-x-1 text-[11px] leading-tight text-[#3b5029]">
        <Check className="h-3.5 w-3.5 shrink-0" />
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
 * La colonne « Preuve de vente » n'est qu'une porte d'entrée : le bouton ouvre
 * la fenêtre de finalisation, où l'on dépose le justificatif et où l'on
 * confirme. Rien ne s'enregistre avant cette confirmation, parce qu'après
 * elle la ligne est verrouillée pour de bon.
 */
function ChampPreuve({
  ligne,
  preuveHref,
  onFinaliser,
}: {
  ligne: Ligne;
  preuveHref: string | null;
  onFinaliser: () => void;
}) {
  if (ligne.statut === "finalized") {
    // La pastille dit déjà « Finalisé » et la colonne Vendu porte la date :
    // répéter les deux ici chargeait la ligne pour rien. Il ne reste que
    // l'accès au fichier, avec la date de finalisation en infobulle.
    const quand = jour(ligne.finaliseeLe);
    if (!preuveHref) {
      return <span className="text-[11px] text-gris-moyen">—</span>;
    }
    return (
      <a
        href={preuveHref}
        target="_blank"
        rel="noreferrer"
        title={quand ? `Finalisée le ${quand}` : undefined}
        className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-gris-moyen underline underline-offset-2 hover:text-noir"
      >
        Voir la preuve <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  if (!estVendue(ligne.statut)) {
    return <span className="text-[11px] text-gris-moyen">—</span>;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onFinaliser}
      className="h-7 w-full px-2 text-[11px]"
    >
      <Paperclip className="mr-1 h-3.5 w-3.5" />
      Finaliser
    </Button>
  );
}

// ===========================================================================
// Liste compacte (mobile et tablette)
// ===========================================================================

function CarteCompacte({
  ligne,
  photoSrc,
  preuveHref,
  onChange,
  onEnregistrerDescription,
  onEnregistrerMarque,
  onEnregistrerNotes,
  onEnregistrerPrix,
  onStatut,
  onVendue,
  onFinaliser,
  onSupprimer,
  onLoupe,
}: LigneProps) {
  const verrouille = estVerrouille(ligne.statut);
  const prixBloques = !!ligne.prixValidesLe;
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
            onKeyDown={sortirSurEntree}
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
        <ChampPreuve ligne={ligne} preuveHref={preuveHref} onFinaliser={onFinaliser} />

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
          onKeyDown={sortirSurEntree}
          inputMode="decimal"
          placeholder="—"
          className="h-8 w-full border-noir/15 bg-transparent px-2 text-left tabular-nums text-sm"
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
              Finaliser la vente
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gris-moyen">
              Déposez la preuve de vente, puis confirmez. C&apos;est ce qui fait entrer
              cette vente dans le montant dû à la cliente.
            </AlertDialog.Description>
          </div>

          {/* Récapitulatif : les trois chiffres qu'on veut relire avant de
              valider quelque chose d'irréversible. */}
          <dl className="space-y-1.5 border border-noir/10 bg-gris-tres-clair p-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-gris-moyen">Pièce</dt>
              <dd className="truncate text-right text-noir">
                {ligne?.description || "Sans description"}
                {ligne?.marque ? ` · ${ligne.marque}` : ""}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-gris-moyen">Vendue</dt>
              <dd className="tabular-nums text-noir">
                {prix != null ? euros(prix) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-noir/10 pt-1.5">
              <dt className="text-gris-moyen">
                La cliente touche ({formatShare(PART_CLIENTE)})
              </dt>
              <dd className="font-serif text-lg tabular-nums text-noir">
                {euros(montantCliente(prix ?? 0))}
              </dd>
            </div>
          </dl>

          <div className="space-y-2 border border-noir/10 p-4">
            <span className="text-[10px] uppercase tracking-[0.14em] text-gris-moyen">
              Preuve de vente
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
                Aucune preuve pour l&apos;instant. Déposez la capture de la vente pour
                pouvoir finaliser.
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
            Cette action est irréversible : la pièce ne pourra plus être modifiée ni
            supprimée.
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
