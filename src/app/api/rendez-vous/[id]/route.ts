// src/app/api/rendez-vous/[id]/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
// Appointments are now stored in the `requests` table.
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .or(`client_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabase
    .from("requests")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if the user is the client for this request
  const { data: existing, error: fetchError } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .eq("client_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Request not found or unauthorized" },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("requests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
