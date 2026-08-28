import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (key) => cookies().get(key)?.value,
      set: (key, value, options) => cookies().set(key, value, options),
      remove: (key, options) => cookies().delete(key, options),
    },
  }
);

export async function POST() {
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
