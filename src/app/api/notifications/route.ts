// src/app/api/notifications/route.ts
// Notification API endpoint following REST conventions and best practices

import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================================================
// Types
// ============================================================================

interface NotificationRequest {
  type: NotificationType;
  vendeuseEmail?: string;
  clientEmail?: string;
  clientNom?: string;
  vendeuseNom?: string;
  email?: string;
  nom?: string;
  date: string;
  heure: string;
}

type NotificationType = 
  | 'nouvelle_demande'
  | 'rendez_vous_confirmation'
  | 'rendez_vous_annulation'
  | 'demande_acceptee'
  | 'demande_refusee';

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate notification request body
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: NotificationRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = body as Record<string, unknown>;

  // Check required fields
  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, error: 'Type is required' };
  }

  if (!data.date || typeof data.date !== 'string') {
    return { valid: false, error: 'Date is required' };
  }

  if (!data.heure || typeof data.heure !== 'string') {
    return { valid: false, error: 'Heure is required' };
  }

  // Validate notification type
  const validTypes: NotificationType[] = [
    'nouvelle_demande',
    'rendez_vous_confirmation',
    'rendez_vous_annulation',
    'demande_acceptee',
    'demande_refusee',
  ];

  if (!validTypes.includes(data.type as NotificationType)) {
    return { valid: false, error: 'Invalid notification type' };
  }

  return { valid: true, data: data as unknown as NotificationRequest };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authenticated user from request
 */
async function getAuthenticatedUser() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { authenticated: false, error: 'Unauthorized' };
  }

  return { authenticated: true, user };
}

// ============================================================================
// Notification Handlers
// ============================================================================

/**
 * Map notification types to service methods
 */
async function handleNotification(
  type: NotificationType,
  data: NotificationRequest
): Promise<{ success: boolean; error?: string }> {
  const handlers: Record<NotificationType, () => Promise<{ success: boolean }>> = {
    nouvelle_demande: async () => {
      if (!data.vendeuseEmail || !data.clientNom) {
        return { success: false };
      }
      if (!process.env.BREVO_API_KEY) return { success: true };
      const result = await notificationService.sendNewAppointmentRequest({
        to: data.vendeuseEmail,
        vendeuseNom: data.vendeuseNom || '',
        clientNom: data.clientNom,
        date: data.date,
        heure: data.heure,
      });
      return { success: result.success };
    },

    rendez_vous_confirmation: async () => {
      if (!data.clientEmail || !data.vendeuseNom) {
        return { success: false };
      }
      if (!process.env.BREVO_API_KEY) return { success: true };
      const result = await notificationService.sendAppointmentConfirmation({
        to: data.clientEmail,
        vendeuseNom: data.vendeuseNom,
        date: data.date,
        heure: data.heure,
      });
      return { success: result.success };
    },

    rendez_vous_annulation: async () => {
      if (!data.email || !data.nom) {
        return { success: false };
      }
      if (!process.env.BREVO_API_KEY) return { success: true };
      const result = await notificationService.sendAppointmentCancellation({
        to: data.email,
        vendeuseNom: data.vendeuseNom || '',
        clientNom: data.nom,
        date: data.date,
        heure: data.heure,
      });
      return { success: result.success };
    },

    demande_acceptee: async () => {
      if (!data.clientEmail || !data.vendeuseNom) {
        return { success: false };
      }
      if (!process.env.BREVO_API_KEY) return { success: true };
      const result = await notificationService.sendAppointmentAccepted({
        to: data.clientEmail,
        vendeuseNom: data.vendeuseNom,
        date: data.date,
        heure: data.heure,
      });
      return { success: result.success };
    },

    demande_refusee: async () => {
      if (!data.clientEmail || !data.vendeuseNom) {
        return { success: false };
      }
      if (!process.env.BREVO_API_KEY) return { success: true };
      const result = await notificationService.sendAppointmentRejected({
        to: data.clientEmail,
        vendeuseNom: data.vendeuseNom,
        date: data.date,
        heure: data.heure,
      });
      return { success: result.success };
    },
  };

  const handler = handlers[type];
  if (!handler) {
    return { success: false, error: 'No handler for notification type' };
  }

  return handler();
}

// ============================================================================
// API Endpoint
// ============================================================================

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { authenticated, error: authError } = await getAuthenticatedUser();
    if (!authenticated) {
      return NextResponse.json(
        { error: authError },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Handle notification
    const result = await handleNotification(
      validation.data!.type,
      validation.data!
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
