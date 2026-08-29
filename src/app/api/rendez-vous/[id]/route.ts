import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("id", id)
    .or(`client_id.eq.${user.id},vendeuse_id.eq.${user.id}`)
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
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if the user is the vendeuse for this rendez-vous
  const { data: rdv, error: rdvError } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("id", id)
    .eq("vendeuse_id", user.id)
    .single();

  if (rdvError || !rdv) {
    return NextResponse.json(
      { error: "Rendez-vous not found or unauthorized" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("rendez_vous")
    .update({ ...body, mis_a_jour_le: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If accepted, update disponibilite statut to reserve
  if (body.statut === "accepte") {
    await supabase
      .from("disponibilites")
      .update({ statut: "reserve" })
      .eq("id", rdv.disponibilite_id);
  }

  // If refused or cancelled, update disponibilite statut back to disponible
  if (body.statut === "refuse" || body.statut === "annule") {
    await supabase
      .from("disponibilites")
      .update({ statut: "disponible" })
      .eq("id", rdv.disponibilite_id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if the user is the client for this rendez-vous
  const { data: rdv, error: rdvError } = await supabase
    .from("rendez_vous")
    .select("*")
    .eq("id", id)
    .eq("client_id", user.id)
    .single();

  if (rdvError || !rdv) {
    return NextResponse.json(
      { error: "Rendez-vous not found or unauthorized" },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("rendez_vous").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update disponibilite statut back to disponible
  await supabase
    .from("disponibilites")
    .update({ statut: "disponible" })
    .eq("id", rdv.disponibilite_id);

  return NextResponse.json({ success: true });
}
