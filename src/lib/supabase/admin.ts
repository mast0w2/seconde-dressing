// src/lib/supabase/admin.ts
// Client Supabase « service role », réservé au serveur.
//
// Il contourne les RLS et donne accès à l'API admin d'authentification.
// On s'en sert uniquement pour générer un lien de connexion sans passer par
// le mailer intégré de Supabase, limité à 2 emails par heure sur le plan
// gratuit (voir src/app/api/auth/espace/route.ts).
//
// La clé n'est jamais exposée au navigateur : ce module n'est importé que
// depuis des routes d'API.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

/**
 * Renvoie un client service role, ou null si la clé n'est pas configurée.
 * Les appelants doivent gérer le cas null : sans la clé, l'application doit
 * continuer à fonctionner en repli sur le mailer Supabase.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return null;
  }

  const { url } = getSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
