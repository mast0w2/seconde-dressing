// src/app/api/estimation/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
// Estimation form API endpoint for handling detailed estimation requests

import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/email';

// ============================================================================
// Types
// ============================================================================

interface EstimationRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  conditionsAcceptees?: boolean;
  formule?: string;
  nombreVetements: number;
  valeurMoyenne: number;
  marques: string;
  description?: string;
  estimation: number;
  address?: string;
  formulaId?: string;
  conditionsAccepted?: boolean;
}

// ============================================================================
// Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-()]{10,}$/;

function validateEstimationData(data: unknown): { valid: boolean; errors?: string[]; data?: EstimationRequest } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const estimationData = data as Record<string, unknown>;

  // Required fields
  if (!estimationData.nom || typeof estimationData.nom !== 'string' || estimationData.nom.trim() === '') {
    errors.push('Nom is required');
  }

  if (!estimationData.prenom || typeof estimationData.prenom !== 'string' || estimationData.prenom.trim() === '') {
    errors.push('Prénom is required');
  }

  if (!estimationData.email || typeof estimationData.email !== 'string' || !EMAIL_REGEX.test(estimationData.email)) {
    errors.push('Valid email is required');
  }

  if (!estimationData.telephone || typeof estimationData.telephone !== 'string' || !PHONE_REGEX.test(estimationData.telephone)) {
    errors.push('Valid phone number is required');
  }

  if (!estimationData.adresse || typeof estimationData.adresse !== 'string' || estimationData.adresse.trim() === '') {
    errors.push('Adresse is required');
  }

  if (!estimationData.nombreVetements || typeof estimationData.nombreVetements !== 'number' || estimationData.nombreVetements < 1) {
    errors.push('Nombre de vêtements must be a positive number');
  }

  if (!estimationData.valeurMoyenne || typeof estimationData.valeurMoyenne !== 'number' || estimationData.valeurMoyenne < 0) {
    errors.push('Valeur moyenne must be a valid number');
  }

  if (!estimationData.marques || typeof estimationData.marques !== 'string' || estimationData.marques.trim() === '') {
    errors.push('Marques is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      nom: (estimationData.nom as string).trim(),
      prenom: (estimationData.prenom as string).trim(),
      email: (estimationData.email as string).trim().toLowerCase(),
      telephone: (estimationData.telephone as string).trim(),
      adresse: (estimationData.adresse as string).trim(),
      conditionsAcceptees: estimationData.conditionsAcceptees === true,
      formule: estimationData.formule ? (estimationData.formule as string).trim() : undefined,
      nombreVetements: estimationData.nombreVetements as number,
      valeurMoyenne: estimationData.valeurMoyenne as number,
      marques: (estimationData.marques as string).trim(),
      description: estimationData.description ? (estimationData.description as string).trim() : undefined,
      estimation: estimationData.estimation as number,
      address: estimationData.address ? (estimationData.address as string).trim() : undefined,
      formulaId: estimationData.formulaId ? (estimationData.formulaId as string).trim() : undefined,
      conditionsAccepted: Boolean(estimationData.conditionsAccepted),
    },
  };
}

// ============================================================================
// Database Operations
// ============================================================================

async function saveEstimationRequest(data: EstimationRequest) {
  const supabase = createSupabaseServerClient();

  // Estimation requests now require an authenticated client (requests.client_id is NOT NULL).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: 'Authentication required' } as any };
  }

  const { error } = await supabase
    .from('requests')
    .insert([
      {
        client_id: user.id,
        request_type: 'estimation',
        message: data.description || null,
        status: 'pending',
        address: data.address || null,
        formula_id: data.formulaId || null,
        conditions_accepted: data.conditionsAccepted,
        number_of_items: data.nombreVetements,
        average_value: data.valeurMoyenne,
        brands: data.marques,
        description: data.description || null,
        estimate: data.estimation,
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
    const validation = validateEstimationData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const estimationData = validation.data!;

    // Save to database
    const dbResult = await saveEstimationRequest(estimationData);
    if (!dbResult.success) {
      console.error('[Estimation API] Database error:', dbResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save estimation request' 
        },
        { status: 500 }
      );
    }

    // Send notification emails with all details (only if BREVO_API_KEY is configured)
    if (process.env.BREVO_API_KEY) {
      const emailResult = await notificationService.sendEstimationNotification(estimationData);
      if (!emailResult.success) {
        console.warn('[Estimation API] Email notification failed:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Votre demande d\'estimation a été envoyée avec succès. Nous vous recontacterons sous 24h.'
    });
  } catch (error) {
    console.error('[Estimation API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
