// src/app/api/estimation/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { capitalizeName } from "@/lib/text";
import { notificationService } from "@/lib/email";

import { NextResponse } from 'next/server';

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

  // Estimation requests can be submitted anonymously from the homepage form:
  // when the submitter is not authenticated, client_id is null and the
  // contact details are stored in the denormalized client_* columns. If a
  // logged-in client submits, the request is linked to their profile.
  const { data: { user } } = await supabase.auth.getUser();

  // The homepage form sends the French formula id (e.g. 'deja-trie');
  // resolve it to the matching formula UUID via its English slug.
  const FORMULA_SLUG_MAP: Record<string, string> = {
    'deja-trie': 'pre-sorted',
    'tri-sur-place': 'on-site-sorting',
    'tri-et-conseil': 'sorting-and-advice',
  };

  let formulaId: string | null = null;
  const slug = data.formule ? FORMULA_SLUG_MAP[data.formule] : undefined;
  if (slug) {
    const { data: formulaRow } = await supabase
      .from('formulas')
      .select('id')
      .eq('slug', slug)
      .single();
    if (formulaRow) {
      formulaId = formulaRow.id as string;
    }
  }

  const { data: insertedRow, error } = await supabase
    .from('requests')
    .insert([
      {
        client_id: user ? user.id : null,
        request_type: 'estimation',
        message: data.description || null,
        status: 'pending',
        address: data.adresse || data.address || null,
        formula_id: formulaId,
        conditions_accepted: data.conditionsAcceptees ?? data.conditionsAccepted ?? false,
        number_of_items: data.nombreVetements,
        average_value: data.valeurMoyenne,
        brands: data.marques,
        description: data.description || null,
        estimate: data.estimation,
        client_first_name: user ? null : capitalizeName(data.prenom),
        client_last_name: user ? null : capitalizeName(data.nom),
        client_email: user ? null : data.email,
        client_phone: user ? null : data.telephone,
      },
    ])
    .select('id')
    .single();

  return { success: !error, error, requestId: (insertedRow as { id?: string } | null)?.id ?? null };
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
      const detail =
        (dbResult.error as { message?: string } | null)?.message ||
        'Failed to save estimation request';
      return NextResponse.json(
        { 
          success: false, 
          error: detail
        },
        { status: 500 }
      );
    }

    // Send a confirmation email to the client (and a copy to admins) listing
    // the actions to take before the appointment, based on the chosen formula.
    if (process.env.BREVO_API_KEY) {
      await notificationService.sendEstimationNotification({
        nom: estimationData.nom,
        prenom: estimationData.prenom,
        email: estimationData.email,
        telephone: estimationData.telephone,
        adresse: estimationData.adresse,
        formule: estimationData.formule,
        nombreVetements: estimationData.nombreVetements,
        valeurMoyenne: estimationData.valeurMoyenne,
        marques: estimationData.marques,
        description: estimationData.description,
        estimation: estimationData.estimation,
      });
    }

    return NextResponse.json({
      success: true,
      requestId: dbResult.requestId,
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
