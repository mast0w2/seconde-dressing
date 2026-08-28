import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({
    cookies: () => cookieStore,
  });
};
