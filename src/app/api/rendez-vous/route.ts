// src/app/api/rendez-vous/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
// Appointments are now stored in the `requests` table (request_type = 'appointment').
// This route is kept for backward compatibility but delegates to `requests`.
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("request_type", "appointment")
    .or(`client_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabase.from("requests").insert([
    {
      client_id: user.id,
      request_type: "appointment",
      message: body.message || null,
      proposed_date: body.proposed_date || null,
      proposed_time: body.proposed_time || null,
      address: body.address || null,
      formula_id: body.formula_id || null,
      conditions_accepted: body.conditions_accepted ?? false,
      status: "pending",
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
