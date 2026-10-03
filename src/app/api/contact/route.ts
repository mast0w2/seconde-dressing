// src/app/api/contact/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
// Contact form API endpoint with validation and error handling

import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/email';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { isLikelySpam } from '@/lib/spam';
import { validateContactData, type ContactFormData } from '@/lib/contact-form';


// Mock notification service when BREVO_API_KEY is not configured
const mockNotificationService = {
  sendContactNotification: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendEstimationNotification: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendNewAppointmentRequest: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendAppointmentConfirmation: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendAppointmentCancellation: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendAppointmentAccepted: async () => ({ success: true, message: 'Email logged but not sent' }),
  sendAppointmentRejected: async () => ({ success: true, message: 'Email logged but not sent' }),
};

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save contact message to database
 */
async function saveContactMessage(data: ContactFormData) {
  const supabase = await createSupabaseServerClient();

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

    // Bots get the same answer as people, so they have no reason to adapt,
    // but nothing is stored or sent.
    if (isLikelySpam(body)) {
      console.warn('[Contact API] Submission dropped by the spam traps');
      return NextResponse.json({
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
      });
    }

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

    // Each call emails the address typed in the form: cap it per caller and
    // per recipient.
    const allowed = await allowRequest(
      { key: `contact:ip:${clientIp(request)}`, max: 5, windowSeconds: 3600 },
      { key: `contact:to:${contactData.email}`, max: 3, windowSeconds: 3600 }
    );
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de messages envoyés. Merci de réessayer un peu plus tard.'
        },
        { status: 429 }
      );
    }

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
    const emailResult = process.env.BREVO_API_KEY
      ? await notificationService.sendContactNotification(contactData)
      : await mockNotificationService.sendContactNotification();

    if (!emailResult.success && 'error' in emailResult) {
      console.warn('[Contact API] Email notification failed:', (emailResult as any).error);
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
