import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  sendNouvelleDemandeNotification,
  sendRendezVousConfirmation,
  sendRendezVousAnnulation,
  sendDemandeAccepteeNotification,
  sendDemandeRefuseeNotification,
} from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, ...data } = body;

  try {
    let success = false;
    
    switch (type) {
      case "nouvelle_demande":
        success = await sendNouvelleDemandeNotification(
          data.vendeuseEmail,
          data.clientNom,
          data.date,
          data.heure
        );
        break;
      case "rendez_vous_confirmation":
        success = await sendRendezVousConfirmation(
          data.clientEmail,
          data.vendeuseNom,
          data.date,
          data.heure
        );
        break;
      case "rendez_vous_annulation":
        success = await sendRendezVousAnnulation(
          data.email,
          data.nom,
          data.date,
          data.heure
        );
        break;
      case "demande_acceptee":
        success = await sendDemandeAccepteeNotification(
          data.clientEmail,
          data.vendeuseNom,
          data.date,
          data.heure
        );
        break;
      case "demande_refusee":
        success = await sendDemandeRefuseeNotification(
          data.clientEmail,
          data.vendeuseNom,
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

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
