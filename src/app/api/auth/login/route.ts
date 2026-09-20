import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachAnonymousRequests } from "@/lib/requests-attach";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const { email, password } = await request.json();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Connexion par mot de passe : rattache les demandes faites sans compte
  // avec cette adresse, comme le fait le lien magique.
  await attachAnonymousRequests(supabase);

  return NextResponse.json({ success: true });
}
