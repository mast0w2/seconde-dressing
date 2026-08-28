import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rendez_vous")
    .select("*")
    .or(`client_id.eq.${user.id},vendeuse_id.eq.${user.id}`)
    .order("cree_le", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if disponibilite exists and is available
  const { data: dispo, error: dispoError } = await supabase
    .from("disponibilites")
    .select("*")
    .eq("id", body.disponibilite_id)
    .eq("statut", "disponible")
    .single();

  if (dispoError || !dispo) {
    return NextResponse.json(
      { error: "Disponibilite not available" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("rendez_vous").insert([{
    client_id: user.id,
    vendeuse_id: dispo.user_id,
    disponibilite_id: body.disponibilite_id,
    statut: "en_attente",
  }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update disponibilite statut to reserve
  await supabase
    .from("disponibilites")
    .update({ statut: "reserve" })
    .eq("id", body.disponibilite_id);

  return NextResponse.json({ success: true });
}
