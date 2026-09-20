"use client";

// Inventaire des pièces d'une demande (photos + description) et suivi des
// prix par pièce :
//   - prix minimal : saisi par la cliente (formule « Déjà trié ») ou par la
//     vendeuse (autres formules), puis VALIDÉ par la cliente. Une fois validé,
//     il est verrouillé pour tout le monde ;
//   - vente : prix final + justificatif, renseignés par la vendeuse seule.
// Les règles sont aussi appliquées en base (trigger request_items_pricing_guard) ;
// l'UI se contente de ne pas proposer ce qui n'est pas permis.

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Mic,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Lock,
  Check,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { PART_CLIENTE, formatShare } from "@/lib/pricing";
import type { RequestItem } from "@/types/database";

type Role = "client" | "seller";

interface RequestItemsUploaderProps {
  requestId: string;
  role: Role;
  /** Slug de la formule : détermine qui saisit le prix minimal. */
  formulaSlug?: string | null;
  /** Appelé après chaque changement persistant (le tableau de bord peut recompter). */
  onItemsChange?: () => void;
}

interface DraftItem {
  localId: string;
  photoUrl: string | null;
  description: string;
  savedItemId?: string;
  uploading: boolean;
  minPrice: string;
  minPriceValidatedAt: string | null;
  salePrice: string;
  saleProofUrl: string | null;
  soldAt: string | null;
  uploadingProof: boolean;
}

/** Qui saisit le prix minimal : la cliente a déjà trié, sinon la vendeuse. */
export function minPriceEditorFor(formulaSlug: string | null | undefined): Role {
  return formulaSlug === "pre-sorted" ? "client" : "seller";
}

function fromRow(row: RequestItem): DraftItem {
  return {
    localId: row.id,
    photoUrl: row.photo_url,
    description: row.description ?? "",
    savedItemId: row.id,
    uploading: false,
    minPrice: row.min_price != null ? String(row.min_price) : "",
    minPriceValidatedAt: row.min_price_validated_at,
    salePrice: row.sale_price != null ? String(row.sale_price) : "",
    saleProofUrl: row.sale_proof_url,
    soldAt: row.sold_at,
    uploadingProof: false,
  };
}

function parsePrice(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function euros(value: number): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function RequestItemsUploader({
  requestId,
  role,
  formulaSlug,
  onItemsChange,
}: RequestItemsUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [validating, setValidating] = useState(false);

  const minPriceEditor = minPriceEditorFor(formulaSlug);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("request_items")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        setLoadingExisting(false);
        return;
      }
      setItems((data as RequestItem[]).map(fromRow));
      setLoadingExisting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, supabase]);

  const persistItem = useCallback(
    async (photoUrl: string, description: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from("request_items")
        .insert([{ request_id: requestId, photo_url: photoUrl, description: description || null }])
        .select("id")
        .single();
      if (error) {
        console.error("[RequestItems] insert error:", error.message);
        return null;
      }
      return (data as { id: string }).id;
    },
    [requestId, supabase]
  );

  const updateDescription = useCallback(
    async (itemId: string, description: string) => {
      const { error } = await supabase
        .from("request_items")
        .update({ description: description || null })
        .eq("id", itemId);
      if (error) console.error("[RequestItems] update error:", error.message);
    },
    [supabase]
  );

  // Mise à jour d'une pièce en base ; l'erreur du trigger (prix verrouillé,
  // rôle non autorisé…) est remontée telle quelle à l'utilisateur.
  const updateItem = useCallback(
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

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);

      const drafts: DraftItem[] = fileArray.map((file) => ({
        localId: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        photoUrl: null,
        description: "",
        uploading: true,
        minPrice: "",
        minPriceValidatedAt: null,
        salePrice: "",
        saleProofUrl: null,
        soldAt: null,
        uploadingProof: false,
      }));
      setItems((prev) => [...prev, ...drafts]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const draft = drafts[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${requestId}/${draft.localId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("request-items")
          .upload(path, file, { contentType: file.type });
        if (uploadError) {
          console.error("[RequestItems] upload error:", uploadError.message);
          setItems((prev) =>
            prev.map((it) =>
              it.localId === draft.localId ? { ...it, uploading: false } : it
            )
          );
          continue;
        }
        const { data: pub } = supabase.storage.from("request-items").getPublicUrl(path);
        const photoUrl = pub.publicUrl;
        const savedId = await persistItem(photoUrl, "");
        setItems((prev) =>
          prev.map((it) =>
            it.localId === draft.localId
              ? { ...it, photoUrl, uploading: false, savedItemId: savedId ?? undefined }
              : it
          )
        );
      }
      onItemsChange?.();
      toast({
        title: "Photos ajoutées",
        description: `${fileArray.length} photo(s) importée(s). Décrivez chaque pièce.`,
      });
    },
    [requestId, supabase, persistItem, toast, onItemsChange]
  );

  const handleDescriptionChange = (localId: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, description: value } : it)));
    const item = items.find((it) => it.localId === localId);
    if (item?.savedItemId) {
      updateDescription(item.savedItemId, value);
    }
  };

  const handleRemove = async (localId: string) => {
    const item = items.find((it) => it.localId === localId);
    if (item?.savedItemId) {
      const { error } = await supabase.from("request_items").delete().eq("id", item.savedItemId);
      if (error) {
        toast({ title: "Erreur", description: "Suppression impossible.", variant: "destructive" });
        return;
      }
    }
    setItems((prev) => prev.filter((it) => it.localId !== localId));
    onItemsChange?.();
  };

  // --- Prix minimal -------------------------------------------------------

  const handleMinPriceChange = (localId: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, minPrice: value } : it)));
  };

  const handleMinPriceBlur = async (localId: string) => {
    const item = items.find((it) => it.localId === localId);
    if (!item?.savedItemId || item.minPriceValidatedAt) return;
    const ok = await updateItem(item.savedItemId, { min_price: parsePrice(item.minPrice) });
    if (!ok) return;
  };

  // La cliente valide d'un coup tous les prix minimaux renseignés et non
  // encore validés. Verrouille ces prix (trigger côté base).
  const handleValidateAll = async () => {
    const toValidate = items.filter(
      (it) => it.savedItemId && !it.minPriceValidatedAt && parsePrice(it.minPrice) != null
    );
    if (toValidate.length === 0) return;
    setValidating(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("request_items")
      .update({ min_price_validated_at: now })
      .in(
        "id",
        toValidate.map((it) => it.savedItemId as string)
      );
    setValidating(false);
    if (error) {
      toast({ title: "Validation refusée", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        toValidate.some((v) => v.localId === it.localId) ? { ...it, minPriceValidatedAt: now } : it
      )
    );
    onItemsChange?.();
    toast({
      title: "Prix validés",
      description: `${toValidate.length} prix minimal${toValidate.length > 1 ? "aux" : ""} validé${
        toValidate.length > 1 ? "s" : ""
      } et verrouillé${toValidate.length > 1 ? "s" : ""}.`,
    });
  };

  // --- Vente (vendeuse) ---------------------------------------------------

  const handleSalePriceChange = (localId: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, salePrice: value } : it)));
  };

  const handleSalePriceBlur = async (localId: string) => {
    const item = items.find((it) => it.localId === localId);
    if (!item?.savedItemId) return;
    await updateItem(item.savedItemId, { sale_price: parsePrice(item.salePrice) });
  };

  const handleProofFile = async (localId: string, file: File | null) => {
    const item = items.find((it) => it.localId === localId);
    if (!file || !item?.savedItemId) return;
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, uploadingProof: true } : it)));
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${requestId}/${item.savedItemId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("sale-proofs")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, uploadingProof: false } : it)));
      toast({ title: "Erreur", description: uploadError.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("sale-proofs").getPublicUrl(path);
    const ok = await updateItem(item.savedItemId, { sale_proof_url: pub.publicUrl });
    setItems((prev) =>
      prev.map((it) =>
        it.localId === localId
          ? { ...it, uploadingProof: false, saleProofUrl: ok ? pub.publicUrl : it.saleProofUrl }
          : it
      )
    );
  };

  const handleMarkSold = async (localId: string, sold: boolean) => {
    const item = items.find((it) => it.localId === localId);
    if (!item?.savedItemId) return;
    const price = parsePrice(item.salePrice);
    if (sold && price == null) {
      toast({
        title: "Prix de vente manquant",
        description: "Renseignez le prix de vente final avant de marquer la pièce vendue.",
        variant: "destructive",
      });
      return;
    }
    const soldAt = sold ? new Date().toISOString() : null;
    const ok = await updateItem(item.savedItemId, { sale_price: price, sold_at: soldAt });
    if (ok) {
      setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, soldAt } : it)));
    }
  };

  // --- Récapitulatif ------------------------------------------------------

  const soldItems = items.filter((it) => it.soldAt && parsePrice(it.salePrice) != null);
  const totalSales = soldItems.reduce((sum, it) => sum + (parsePrice(it.salePrice) ?? 0), 0);
  const pendingValidation = items.filter(
    (it) => it.savedItemId && !it.minPriceValidatedAt && parsePrice(it.minPrice) != null
  ).length;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Inventaire</h4>
          <span className="text-sm text-gris-moyen">
            {items.length} {items.length > 1 ? "vêtements" : "vêtement"}
          </span>
          <InfoTooltip label="À quoi sert l’inventaire ?" align="left">
            L’inventaire sert à répertorier vos vêtements pour garder une
            traçabilité. Les photos ne sont pas utilisées pour la vente&nbsp;:
            nul besoin de faire de belles photos, un simple cliché suffit pour
            identifier chaque pièce.
          </InfoTooltip>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Ajouter des photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Qui fait quoi sur les prix */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border border-noir/10 bg-gris-tres-clair p-3 text-sm">
          <p className="flex-1 text-gris-moyen">
            {minPriceEditor === role ? (
              <>
                Indiquez pour chaque pièce le <strong className="text-noir">prix de vente minimal</strong>
                {role === "seller" ? " souhaité par la cliente" : " en dessous duquel vous ne souhaitez pas vendre"}
                . {role === "client" ? "Validez ensuite pour les verrouiller." : "La cliente les validera ensuite."}
              </>
            ) : role === "client" ? (
              <>
                La vendeuse indique le <strong className="text-noir">prix de vente minimal</strong> de chaque
                pièce. Validez-les pour les verrouiller : ils ne pourront plus changer.
              </>
            ) : (
              <>
                La cliente indique le <strong className="text-noir">prix de vente minimal</strong> de chaque
                pièce et le valide. Vous renseignez ensuite le prix de vente final et le justificatif.
              </>
            )}
          </p>
          {role === "client" && pendingValidation > 0 && (
            <Button size="sm" onClick={handleValidateAll} disabled={validating} className="h-8 px-3">
              <Check className="h-4 w-4 mr-1" />
              {validating ? "Validation…" : `Valider ${pendingValidation} prix minimal${pendingValidation > 1 ? "aux" : ""}`}
            </Button>
          )}
        </div>
      )}

      {soldItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-noir">
            {soldItems.length} pièce{soldItems.length > 1 ? "s" : ""} vendue{soldItems.length > 1 ? "s" : ""} ·{" "}
            {euros(totalSales)}
          </span>
          <span className="text-sauge-fonce">
            Part cliente ({formatShare(PART_CLIENTE)}) : {euros(totalSales * PART_CLIENTE)}
          </span>
        </div>
      )}

      {loadingExisting ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun vêtement ajouté. Importez un batch de photos pour créer la liste.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.localId}
              item={item}
              role={role}
              canEditMinPrice={minPriceEditor === role && !item.minPriceValidatedAt}
              onDescriptionChange={(v) => handleDescriptionChange(item.localId, v)}
              onRemove={() => handleRemove(item.localId)}
              onMinPriceChange={(v) => handleMinPriceChange(item.localId, v)}
              onMinPriceBlur={() => handleMinPriceBlur(item.localId)}
              onSalePriceChange={(v) => handleSalePriceChange(item.localId, v)}
              onSalePriceBlur={() => handleSalePriceBlur(item.localId)}
              onProofFile={(f) => handleProofFile(item.localId, f)}
              onMarkSold={(sold) => handleMarkSold(item.localId, sold)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  role,
  canEditMinPrice,
  onDescriptionChange,
  onRemove,
  onMinPriceChange,
  onMinPriceBlur,
  onSalePriceChange,
  onSalePriceBlur,
  onProofFile,
  onMarkSold,
}: {
  item: DraftItem;
  role: Role;
  canEditMinPrice: boolean;
  onDescriptionChange: (value: string) => void;
  onRemove: () => void;
  onMinPriceChange: (value: string) => void;
  onMinPriceBlur: () => void;
  onSalePriceChange: (value: string) => void;
  onSalePriceBlur: () => void;
  onProofFile: (file: File | null) => void;
  onMarkSold: (sold: boolean) => void;
}) {
  const proofInputRef = useRef<HTMLInputElement>(null);
  const { isListening, error, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      onDescriptionChange(item.description ? `${item.description} ${transcript}` : transcript);
    },
  });

  const minPrice = parsePrice(item.minPrice);
  const salePrice = parsePrice(item.salePrice);
  const sold = !!item.soldAt;

  return (
    <div className="rounded-lg border border-noir/15 p-3 space-y-3">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {item.uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photoUrl} alt="Vêtement" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <Textarea
            value={item.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Décrivez la pièce (marque, taille, couleur, état…) ou dictez-la."
            rows={2}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isListening ? stop : start}
              aria-label="Dicter la description"
            >
              <Mic className={`h-4 w-4 mr-2 ${isListening ? "text-red-500 animate-pulse" : ""}`} />
              {isListening ? "Arrêter" : "Dicter"}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={onRemove}
          aria-label="Retirer ce vêtement"
          disabled={sold}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {item.savedItemId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-noir/10 pt-3">
          {/* Prix minimal */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase text-gris-moyen">
              Prix minimal
              {item.minPriceValidatedAt && <Lock className="h-3 w-3 text-sauge-fonce" />}
            </div>
            {canEditMinPrice ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.5"
                  value={item.minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  onBlur={onMinPriceBlur}
                  placeholder="—"
                  className="h-9 w-28"
                />
                <span className="text-sm text-gris-moyen">€</span>
              </div>
            ) : (
              <div className="text-sm text-noir">
                {minPrice != null ? euros(minPrice) : <span className="text-gris-moyen">Non renseigné</span>}
              </div>
            )}
            <div className="text-xs text-gris-moyen">
              {item.minPriceValidatedAt
                ? `Validé par la cliente le ${new Date(item.minPriceValidatedAt).toLocaleDateString("fr-FR")}`
                : minPrice != null
                ? role === "client"
                  ? "À valider"
                  : "En attente de validation par la cliente"
                : ""}
            </div>
          </div>

          {/* Vente */}
          <div className="space-y-1">
            <div className="text-xs tracking-[0.12em] uppercase text-gris-moyen">Vente</div>
            {role === "seller" ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={item.salePrice}
                    onChange={(e) => onSalePriceChange(e.target.value)}
                    onBlur={onSalePriceBlur}
                    placeholder="Prix final"
                    className="h-9 w-28"
                    disabled={sold}
                  />
                  <span className="text-sm text-gris-moyen">€</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => proofInputRef.current?.click()}
                    disabled={item.uploadingProof}
                  >
                    {item.uploadingProof ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4 mr-1" />
                    )}
                    {item.saleProofUrl ? "Remplacer le justificatif" : "Justificatif"}
                  </Button>
                  <input
                    ref={proofInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      onProofFile(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {sold ? (
                    <>
                      <span className="text-sm text-sauge-fonce">
                        Vendue {salePrice != null ? euros(salePrice) : ""} le{" "}
                        {new Date(item.soldAt as string).toLocaleDateString("fr-FR")}
                      </span>
                      <button
                        type="button"
                        onClick={() => onMarkSold(false)}
                        className="text-xs text-gris-moyen underline"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      onClick={() => onMarkSold(true)}
                      disabled={salePrice == null}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Marquer vendue
                    </Button>
                  )}
                  <ProofLink url={item.saleProofUrl} />
                </div>
              </div>
            ) : sold && salePrice != null ? (
              <div className="space-y-1 text-sm">
                <div className="text-noir">
                  Vendue {euros(salePrice)} le {new Date(item.soldAt as string).toLocaleDateString("fr-FR")}
                </div>
                <div className="text-sauge-fonce">Votre part : {euros(salePrice * PART_CLIENTE)}</div>
                <ProofLink url={item.saleProofUrl} />
              </div>
            ) : (
              <div className="text-sm text-gris-moyen">Pas encore vendue</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProofLink({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-sauge-fonce underline"
    >
      <ExternalLink className="h-3 w-3" />
      Voir le justificatif
    </a>
  );
}

export default RequestItemsUploader;
