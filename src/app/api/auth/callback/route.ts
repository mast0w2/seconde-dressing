import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }

      if (profile) {
        // Profile exists: send to /profile to fill phone/address when incomplete,
        // otherwise to the role dashboard.
        if (!isProfileComplete(profile)) {
          return NextResponse.redirect(new URL("/profile", requestUrl.origin).toString());
        }
        const dashboard =
          profile.role === "seller"
            ? "/dashboard/vendeur"
            : "/dashboard/client";
        return NextResponse.redirect(new URL(dashboard, requestUrl.origin).toString());
      }

      // No profile row yet (e.g. signup profile insert failed): the login page
      // creates a minimal one and redirects to /profile to complete it.
      return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin).toString());
}
