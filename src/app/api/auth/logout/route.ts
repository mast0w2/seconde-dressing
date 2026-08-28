import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
