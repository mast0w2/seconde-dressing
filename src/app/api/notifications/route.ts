import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  sendNouvelleDemandeNotification,
  sendRendezVousConfirmation,
  sendRendezVousAnnulation,
} from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, ...data } = body;

  try {
    switch (type) {
      case "nouvelle_demande":
        await sendNouvelleDemandeNotification(
          data.vendeuseEmail,
          data.clientNom,
          data.date,
          data.heure
        );
        break;
      case "rendez_vous_confirmation":
        await sendRendezVousConfirmation(
          data.clientEmail,
          data.vendeuseNom,
          data.date,
          data.heure
        );
        break;
      case "rendez_vous_annulation":
        await sendRendezVousAnnulation(
          data.email,
          data.nom,
          data.date,
          data.heure
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
