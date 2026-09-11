"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Mic, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { RequestItem } from "@/types/database";

interface RequestItemsUploaderProps {
  requestId: string;
}

interface DraftItem {
  localId: string;
  photoUrl: string | null;
  description: string;
  savedItemId?: string;
  uploading: boolean;
}

export function RequestItemsUploader({ requestId }: RequestItemsUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

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
      setItems(
        (data as RequestItem[]).map((row) => ({
          localId: row.id,
          photoUrl: row.photo_url,
          description: row.description ?? "",
          savedItemId: row.id,
          uploading: false,
        }))
      );
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

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);

      const drafts: DraftItem[] = fileArray.map((file) => ({
        localId: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        photoUrl: null,
        description: "",
        uploading: true,
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
      toast({
        title: "Photos ajoutées",
        description: `${fileArray.length} photo(s) importée(s). Décrivez chaque pièce.`,
      });
    },
    [requestId, supabase, persistItem, toast]
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
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Vêtements de la demande</h4>
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
              onDescriptionChange={(v) => handleDescriptionChange(item.localId, v)}
              onRemove={() => handleRemove(item.localId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onDescriptionChange,
  onRemove,
}: {
  item: DraftItem;
  onDescriptionChange: (value: string) => void;
  onRemove: () => void;
}) {
  const { isListening, error, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      onDescriptionChange(item.description ? `${item.description} ${transcript}` : transcript);
    },
  });

  return (
    <div className="flex gap-4 rounded-lg border border-noir/15 p-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {item.uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : item.photoUrl ? (
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
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default RequestItemsUploader;
