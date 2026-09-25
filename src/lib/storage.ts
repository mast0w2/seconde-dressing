// src/lib/storage.ts
// Files of the private buckets (item photos, sale proofs) are read through
// short-lived signed URLs: since migration 0022, only the two parties of a
// request can read its files.
//
// Rows written before that migration store a full public URL
// (…/storage/v1/object/public/<bucket>/<path>); newer rows store the bare
// path. `storagePath` accepts both, so no data had to be migrated.

import type { SupabaseClient } from "@supabase/supabase-js";

export type PrivateBucket = "request-items" | "sale-proofs";

const SIGNED_URL_TTL_SECONDS = 3600;

/** Path of a file inside its bucket, from what the database stores. */
export function storagePath(stored: string, bucket: PrivateBucket): string {
  const marker = `/object/public/${bucket}/`;
  const at = stored.indexOf(marker);
  if (at === -1) return stored;

  // getPublicUrl() runs the URL through encodeURI(): undo it.
  const encoded = stored.slice(at + marker.length).split("?")[0];
  try {
    return decodeURI(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Signs every stored value in one call. Returns a map from the stored value
 * (as found in the row) to its signed URL; values that could not be signed
 * are left out.
 */
export async function signStoredFiles(
  supabase: SupabaseClient,
  bucket: PrivateBucket,
  stored: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(stored.filter(Boolean)));
  if (unique.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(
      unique.map((value) => storagePath(value, bucket)),
      SIGNED_URL_TTL_SECONDS
    );

  if (error || !data) {
    console.error(`[storage] Could not sign files of ${bucket}:`, error?.message);
    return {};
  }

  const signed: Record<string, string> = {};
  data.forEach((entry, index) => {
    if (entry.signedUrl) signed[unique[index]] = entry.signedUrl;
  });
  return signed;
}
