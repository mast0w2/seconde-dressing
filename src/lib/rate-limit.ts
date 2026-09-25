// src/lib/rate-limit.ts
// Rate limiting shared by every server instance.
//
// Counts go through the `rate_limit_hit` SQL function (migration 0023), so
// every Vercel instance sees the same numbers. Keys are hashed before they
// leave the process: the table never stores an email or an IP address.
//
// Without the service role key, or when the call fails (migration not applied
// yet, database unreachable), we fall back to a count in process memory:
// per instance only, but still a guardrail rather than none.

import { createHash } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RateLimitRule {
  /** What is counted, e.g. `contact:ip:1.2.3.4`. Hashed before storage. */
  key: string;
  max: number;
  windowSeconds: number;
}

const memory = new Map<string, number[]>();

function hitInMemory(key: string, max: number, windowSeconds: number): boolean {
  const now = Date.now();
  const hits = (memory.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);

  if (hits.length >= max) {
    memory.set(key, hits);
    return false;
  }

  hits.push(now);
  memory.set(key, hits);
  return true;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Records one call against each rule, in order, and returns false as soon as
 * one of them is exhausted.
 */
export async function allowRequest(...rules: RateLimitRule[]): Promise<boolean> {
  const admin = getSupabaseAdminClient();

  for (const rule of rules) {
    const key = hashKey(rule.key);
    let allowed: boolean;

    if (admin) {
      const { data, error } = await admin.rpc("rate_limit_hit", {
        bucket_key: key,
        max_hits: rule.max,
        window_seconds: rule.windowSeconds,
      });
      if (error) {
        console.error("[rate-limit] Shared counter unavailable, using memory:", error.message);
        allowed = hitInMemory(key, rule.max, rule.windowSeconds);
      } else {
        allowed = data === true;
      }
    } else {
      allowed = hitInMemory(key, rule.max, rule.windowSeconds);
    }

    if (!allowed) return false;
  }

  return true;
}

/**
 * The caller's IP address. On Vercel the edge overwrites X-Forwarded-For, so
 * its first entry cannot be spoofed by the client.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    (forwarded?.split(",")[0] ?? "").trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
