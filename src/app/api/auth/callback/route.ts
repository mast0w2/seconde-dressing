import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }

      if (profile) {
        // Profile exists, check if it's complete
        if (!profile.nom || !profile.prenom) {
          // Profile incomplete, redirect to complete profile
          return NextResponse.redirect(new URL("/complete-profile", requestUrl.origin).toString());
        }
        
        // Profile is complete, check if role is set
        if (!profile.role) {
          // Role not set, redirect to role selection
          return NextResponse.redirect(new URL("/role", requestUrl.origin).toString());
        }
      } else {
        // No profile exists, redirect to complete profile
        return NextResponse.redirect(new URL("/complete-profile", requestUrl.origin).toString());
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}
