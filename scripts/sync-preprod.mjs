// scripts/sync-preprod.mjs
// Replaces the preprod data with a copy of production.
//
//   SUPABASE_ACCESS_TOKEN=... npm run db:sync-preprod
//
// The token is a Supabase personal access token
// (https://supabase.com/dashboard/account/tokens). It goes through the
// Management API, so neither database password is needed.
//
// WHAT IS COPIED: accounts (auth.users, auth.identities, password hashes
// included, so production credentials work on preprod) and every table in
// `public`. Sessions are not copied: everyone signs in again.
//
// STORAGE FILES are copied too, after the tables, by
// scripts/sync-preprod-storage.mjs: item photos and sale proofs are private
// since migration 0022, so preprod could no longer display the production
// files its rows point to. Only what changed is transferred.
//
// The schema is NOT copied either: preprod is built from supabase/schema.sql,
// and new migrations are applied to it by hand. If a table gained a column on
// preprod only, that column is left to its default.

import { pathToFileURL } from 'node:url';
import { syncStorage } from './sync-preprod-storage.mjs';

const PROD_REF = 'jqjqcgsjkaqsyejfpdco';
const PREPROD_REF = 'iqwmcbbbgmdjmhjptovg';

// Parents before children: rows are inserted in this order.
const TABLES = [
  'auth.users',
  'auth.identities',
  'public.formulas',
  'public.profiles',
  'public.requests',
  'public.request_items',
  'public.request_refusals',
  'public.request_contracts',
  'public.reviews',
  'public.contact_messages',
];

/** SQL run on production: every table as one JSON document. Read-only. */
export function buildExportQuery(tables = TABLES) {
  const parts = tables.map(
    (t) => `'${t}', (SELECT coalesce(json_agg(x), '[]'::json) FROM ${t} x)`
  );
  return `SELECT json_build_object(${parts.join(', ')}) AS payload`;
}

/**
 * SQL run on preprod: empties the tables, then loads the payload, in a single
 * transaction. Generated columns (auth.users.confirmed_at,
 * auth.identities.email) are skipped: PostgreSQL computes them.
 */
export function buildLoadQuery(payload, tables = TABLES) {
  const json = JSON.stringify(payload);
  // A dollar-quote tag that cannot occur in the data.
  let tag = 'payload';
  while (json.includes(`$${tag}$`)) tag += '_';

  const tableList = tables.map((t) => `'${t}'`).join(', ');
  const reversedList = [...tables].reverse().map((t) => `'${t}'`).join(', ');

  return `
DO $load$
DECLARE
  data   jsonb := $${tag}$${json}$${tag}$::jsonb;
  tbl    text;
  cols   text;
BEGIN
  -- Skips triggers and foreign key checks while loading: the rows come from a
  -- consistent database, and the triggers would otherwise rewrite them
  -- (request_items_pricing_guard, update_updated_at).
  SET LOCAL session_replication_role = replica;

  -- Children first. Deleting auth.users also drops sessions and tokens.
  FOREACH tbl IN ARRAY ARRAY[${reversedList}] LOOP
    EXECUTE format('DELETE FROM %s', tbl);
  END LOOP;

  FOREACH tbl IN ARRAY ARRAY[${tableList}] LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum) INTO cols
      FROM pg_attribute a
     WHERE a.attrelid = tbl::regclass
       AND a.attnum > 0
       AND NOT a.attisdropped
       AND a.attgenerated = ''
       -- Only the columns production sent: a column added on preprod only
       -- keeps its default.
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(data -> tbl) r WHERE r ? a.attname LIMIT 1
       );

    IF cols IS NOT NULL THEN
      EXECUTE format(
        'INSERT INTO %s (%s) SELECT %s FROM jsonb_populate_recordset(NULL::%s, $1)',
        tbl, cols, cols, tbl
      ) USING data -> tbl;
    END IF;
  END LOOP;
END
$load$;

SELECT ${tables
    .map((t) => `(SELECT count(*) FROM ${t}) AS "${t}"`)
    .join(', ')};
`;
}

async function runQuery(ref, query, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Query on ${ref} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is missing (https://supabase.com/dashboard/account/tokens).');
    process.exit(1);
  }
  // The target is a constant, never read from the environment: a typo must
  // not be able to point this script at production.
  if (PREPROD_REF === PROD_REF) throw new Error('Refusing to overwrite production.');

  console.log(`Reading production (${PROD_REF})…`);
  const [{ payload }] = await runQuery(PROD_REF, buildExportQuery(), token);

  console.log(`Replacing preprod data (${PREPROD_REF})…`);
  const counts = await runQuery(PREPROD_REF, buildLoadQuery(payload), token);
  console.table(counts[0]);

  console.log('Copying storage files…');
  await syncStorage({ prodRef: PROD_REF, preprodRef: PREPROD_REF, token });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
