import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });

  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to database
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          subject,
          message,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save contact message" },
        { status: 500 }
      );
    }

    // Send notification emails
    const emailSent = await sendContactNotification(name, email, subject, message);

    if (!emailSent) {
      console.warn("Failed to send contact notification emails");
      // Still return success since the message was saved
    }

    return NextResponse.json({ 
      success: true, 
      message: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais." 
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
