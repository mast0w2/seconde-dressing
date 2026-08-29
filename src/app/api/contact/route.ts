// src/app/api/contact/route.ts
// Contact form API endpoint with validation and error handling

import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================================================
// Types
// ============================================================================

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate contact form data
 */
function validateContactData(data: unknown): { valid: boolean; errors?: string[]; data?: ContactRequest } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const contactData = data as Record<string, unknown>;

  // Required fields
  if (!contactData.name || typeof contactData.name !== 'string' || contactData.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!contactData.email || typeof contactData.email !== 'string' || !EMAIL_REGEX.test(contactData.email)) {
    errors.push('Valid email is required');
  }

  if (!contactData.subject || typeof contactData.subject !== 'string' || contactData.subject.trim() === '') {
    errors.push('Subject is required');
  }

  if (!contactData.message || typeof contactData.message !== 'string' || contactData.message.trim() === '') {
    errors.push('Message is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: (contactData.name as string).trim(),
      email: (contactData.email as string).trim().toLowerCase(),
      phone: contactData.phone ? (contactData.phone as string).trim() : undefined,
      subject: (contactData.subject as string).trim(),
      message: (contactData.message as string).trim(),
    },
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save contact message to database
 */
async function saveContactMessage(data: ContactRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { error } = await supabase
    .from('contact_messages')
    .insert([
      {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

  return { success: !error, error };
}

// ============================================================================
// API Endpoint
// ============================================================================

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate data
    const validation = validateContactData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const contactData = validation.data!;

    // Save to database
    const dbResult = await saveContactMessage(contactData);
    if (!dbResult.success) {
      console.error('[Contact API] Database error:', dbResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save contact message' 
        },
        { status: 500 }
      );
    }

    // Send notification emails
    const emailResult = await notificationService.sendContactNotification(contactData);

    if (!emailResult.success) {
      console.warn('[Contact API] Email notification failed:', emailResult.error);
      // Still return success since message was saved
    }

    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
    });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
