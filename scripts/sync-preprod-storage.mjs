// scripts/sync-preprod-storage.mjs
// Mirrors the production storage buckets into preprod. Called by
// scripts/sync-preprod.mjs, after the tables.
//
// WHY: since migration 0022 item photos and sale proofs are private, so
// preprod can no longer display the production files its copied rows point
// to. The files themselves are copied instead, under the same paths; the app
// signs them against whichever project it runs on (src/lib/storage.ts).
//
// HOW: both projects' service keys are fetched with the same personal access
// token (Management API), then the storage REST API lists, downloads and
// uploads. Only what differs is transferred: a file missing on preprod, or of
// a different size, is copied; a file gone from production is deleted.

const BUCKETS = ['avatars', 'request-items', 'sale-proofs'];
const PAGE_SIZE = 1000;
const DELETE_BATCH = 100;

/**
 * Service key from a `GET /v1/projects/{ref}/api-keys?reveal=true` answer:
 * the legacy `service_role` key when the project still has it, otherwise a
 * new-style secret key.
 */
export function pickServiceKey(keys) {
  const legacy = keys.find((k) => k.name === 'service_role' && k.api_key);
  if (legacy) return legacy.api_key;
  const secret = keys.find((k) => k.type === 'secret' && k.api_key);
  if (secret) return secret.api_key;
  throw new Error('No service key returned: the access token cannot read this project’s secret keys.');
}

/** What to copy and what to delete so that `target` matches `source`. */
export function planStorageSync(source, target) {
  const targetByPath = new Map(target.map((f) => [f.path, f]));
  const sourcePaths = new Set(source.map((f) => f.path));
  return {
    copy: source
      .filter((f) => targetByPath.get(f.path)?.size !== f.size)
      .map((f) => f.path),
    remove: target.filter((f) => !sourcePaths.has(f.path)).map((f) => f.path),
  };
}

/** Object path for a storage URL, each segment encoded. */
export function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function serviceKey(ref, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`API keys of ${ref}: ${res.status} ${await res.text()}`);
  }
  return pickServiceKey(await res.json());
}

export function storageApi(ref, key) {
  return {
    ref,
    base: `https://${ref}.supabase.co/storage/v1`,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  };
}

/** Every file of a bucket, folders walked recursively. */
export async function listFiles(api, bucket, prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(`${api.base}/object/list/${bucket}`, {
      method: 'POST',
      headers: { ...api.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) {
      throw new Error(`Listing ${bucket}/${prefix} on ${api.ref}: ${res.status} ${await res.text()}`);
    }
    const entries = await res.json();
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back without an id.
      if (entry.id === null) {
        files.push(...(await listFiles(api, bucket, path)));
      } else {
        files.push({ path, size: entry.metadata?.size ?? null });
      }
    }
    if (entries.length < PAGE_SIZE) return files;
  }
}

export async function copyFile(from, to, bucket, path) {
  const download = await fetch(`${from.base}/object/${bucket}/${encodePath(path)}`, {
    headers: from.headers,
  });
  if (!download.ok) {
    throw new Error(`download ${download.status} ${await download.text()}`);
  }
  const upload = await fetch(`${to.base}/object/${bucket}/${encodePath(path)}`, {
    method: 'POST',
    headers: {
      ...to.headers,
      'Content-Type': download.headers.get('content-type') ?? 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: Buffer.from(await download.arrayBuffer()),
  });
  if (!upload.ok) {
    throw new Error(`upload ${upload.status} ${await upload.text()}`);
  }
}

export async function removeFiles(api, bucket, paths) {
  for (let i = 0; i < paths.length; i += DELETE_BATCH) {
    const res = await fetch(`${api.base}/object/${bucket}`, {
      method: 'DELETE',
      headers: { ...api.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: paths.slice(i, i + DELETE_BATCH) }),
    });
    if (!res.ok) {
      throw new Error(`Deleting from ${bucket} on ${api.ref}: ${res.status} ${await res.text()}`);
    }
  }
}

/**
 * Copies the production buckets into preprod. Keeps going when a single file
 * fails, then throws at the end so the workflow run is marked failed.
 */
export async function syncStorage({ prodRef, preprodRef, token }) {
  const [prodKey, preprodKey] = await Promise.all([
    serviceKey(prodRef, token),
    serviceKey(preprodRef, token),
  ]);
  const prod = storageApi(prodRef, prodKey);
  const preprod = storageApi(preprodRef, preprodKey);

  const failures = [];
  const summary = {};

  for (const bucket of BUCKETS) {
    const [source, target] = await Promise.all([
      listFiles(prod, bucket),
      listFiles(preprod, bucket),
    ]);
    const { copy, remove } = planStorageSync(source, target);

    let copied = 0;
    for (const path of copy) {
      try {
        await copyFile(prod, preprod, bucket, path);
        copied += 1;
      } catch (err) {
        failures.push(`${bucket}/${path}: ${err.message}`);
      }
    }
    if (remove.length > 0) {
      await removeFiles(preprod, bucket, remove);
    }

    summary[bucket] = { files: source.length, copied, removed: remove.length };
  }

  console.table(summary);

  if (failures.length > 0) {
    throw new Error(`${failures.length} file(s) not copied:\n${failures.join('\n')}`);
  }
}
