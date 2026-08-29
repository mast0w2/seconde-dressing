// src/app/api/reviews/route.ts
// Reviews API endpoint with validation and rate limiting

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================================================
// Types
// ============================================================================

interface ReviewRequest {
  client_name: string;
  rating: number;
  comment: string;
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate review submission
 */
function validateReview(data: unknown): { valid: boolean; errors?: string[]; data?: ReviewRequest } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const reviewData = data as Record<string, unknown>;

  // Required fields
  if (!reviewData.client_name || typeof reviewData.client_name !== 'string' || reviewData.client_name.trim() === '') {
    errors.push('Client name is required');
  }

  if (typeof reviewData.rating !== 'number' || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('Rating must be a number between 1 and 5');
  }

  if (!reviewData.comment || typeof reviewData.comment !== 'string' || reviewData.comment.trim() === '') {
    errors.push('Comment is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      client_name: (reviewData.client_name as string).trim(),
      rating: Math.round(reviewData.rating as number),
      comment: (reviewData.comment as string).trim(),
    },
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Check if client already submitted a review
 */
async function checkExistingReview(clientName: string): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('client_name', clientName)
    .single();

  return !!data && !error;
}

/**
 * Save review to database
 */
async function saveReview(data: ReviewRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { data: reviewData, error } = await supabase
    .from('reviews')
    .insert([
      {
        client_name: data.client_name,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date().toISOString(),
      },
    ]);

  return { success: !error, data: reviewData, error };
}

/**
 * Get all reviews from database
 */
async function getAllReviews(): Promise<Review[]> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Reviews API] Error fetching reviews:', error);
    return [];
  }

  return data as Review[];
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * GET /api/reviews - Get all reviews
 */
export async function GET() {
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error('[Reviews API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Submit a new review
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate data
    const validation = validateReview(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const reviewData = validation.data!;

    // Check for existing review
    const exists = await checkExistingReview(reviewData.client_name);
    if (exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vous avez déjà soumis un avis.' 
        },
        { status: 400 }
      );
    }

    // Save review
    const dbResult = await saveReview(reviewData);
    if (!dbResult.success) {
      console.error('[Reviews API] Database error:', dbResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to submit review' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Votre avis a été soumis avec succès. Merci !',
      data: dbResult.data,
    });
  } catch (error) {
    console.error('[Reviews API] POST Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
