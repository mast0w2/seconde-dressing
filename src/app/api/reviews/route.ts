import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });

  try {
    const body = await request.json();
    const { client_name, rating, comment } = body;

    // Validate required fields
    if (!client_name || !rating || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: client_name, rating, comment" },
        { status: 400 }
      );
    }

    // Validate rating (1-5)
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if this client already submitted a review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("client_name", client_name)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis un avis." },
        { status: 400 }
      );
    }

    // Save review to database
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          client_name,
          rating,
          comment,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Votre avis a été soumis avec succès. Merci !",
      data: data || []
    });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
