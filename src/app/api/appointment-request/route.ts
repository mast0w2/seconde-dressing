// src/app/api/appointment-request/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { capitalizeName } from "@/lib/text";
import { notificationService } from "@/lib/email";

import { NextResponse } from 'next/server';

// ============================================================================
// Types
// ============================================================================

interface AppointmentRequestData {
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

function validateRequestData(data: unknown): { valid: boolean; errors?: string[]; data?: AppointmentRequestData } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const requestData = data as Record<string, unknown>;

  // Required fields
  if (!requestData.nom || typeof requestData.nom !== 'string' || requestData.nom.trim() === '') {
    errors.push('Nom is required');
  }

  if (!requestData.prenom || typeof requestData.prenom !== 'string' || requestData.prenom.trim() === '') {
    errors.push('Prénom is required');
  }

  if (!requestData.email || typeof requestData.email !== 'string' || !EMAIL_REGEX.test(requestData.email)) {
    errors.push('Valid email is required');
  }

  if (!requestData.telephone || typeof requestData.telephone !== 'string' || !PHONE_REGEX.test(requestData.telephone)) {
    errors.push('Valid phone number is required');
  }

  if (!requestData.adresse || typeof requestData.adresse !== 'string' || requestData.adresse.trim() === '') {
    errors.push('Adresse is required');
  }

  if (!requestData.nombreVetements || typeof requestData.nombreVetements !== 'number' || requestData.nombreVetements < 1) {
    errors.push('Nombre de vêtements must be a positive number');
  }

  if (!requestData.valeurMoyenne || typeof requestData.valeurMoyenne !== 'number' || requestData.valeurMoyenne < 0) {
    errors.push('Valeur moyenne must be a valid number');
  }

  if (!requestData.marques || typeof requestData.marques !== 'string' || requestData.marques.trim() === '') {
    errors.push('Marques is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      nom: (requestData.nom as string).trim(),
      prenom: (requestData.prenom as string).trim(),
      email: (requestData.email as string).trim().toLowerCase(),
      telephone: (requestData.telephone as string).trim(),
      adresse: (requestData.adresse as string).trim(),
      conditionsAcceptees: requestData.conditionsAcceptees === true,
      formule: requestData.formule ? (requestData.formule as string).trim() : undefined,
      nombreVetements: requestData.nombreVetements as number,
      valeurMoyenne: requestData.valeurMoyenne as number,
      marques: (requestData.marques as string).trim(),
      description: requestData.description ? (requestData.description as string).trim() : undefined,
      estimation: requestData.estimation as number,
      address: requestData.address ? (requestData.address as string).trim() : undefined,
      formulaId: requestData.formulaId ? (requestData.formulaId as string).trim() : undefined,
      conditionsAccepted: Boolean(requestData.conditionsAccepted),
    },
  };
}

// ============================================================================
// Database Operations
// ============================================================================

async function saveAppointmentRequest(data: AppointmentRequestData) {
  const supabase = createSupabaseServerClient();

  // L'écriture passe par le client service role quand il est disponible.
  // Deux raisons : la RLS de `requests` peut alors être activée sans que le
  // formulaire public en pâtisse (une insertion anonyme suivie d'un RETURNING
  // exige une politique de lecture, qu'une visiteuse non connectée n'a pas),
  // et les données à écrire sont déjà validées juste au-dessus.
  // À défaut de clé, on retombe sur le client porteur des cookies.
  const ecriture = getSupabaseAdminClient() ?? supabase;

  // Appointment requests can be submitted anonymously from the homepage form:
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

  const { data: insertedRow, error } = await ecriture
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
    const validation = validateRequestData(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const requestData = validation.data!;

    // Save to database
    const dbResult = await saveAppointmentRequest(requestData);
    if (!dbResult.success) {
      console.error('[Appointment Request API] Database error:', dbResult.error);
      const detail =
        (dbResult.error as { message?: string } | null)?.message ||
        'Failed to save appointment request';
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
    // We never fail the whole request on an email error, but we log the
    // Brevo response so failures (rejected sender, invalid key, etc.) are
    // visible in the server logs instead of being swallowed silently.
    if (process.env.BREVO_API_KEY) {
      const emailResult = await notificationService.sendRequestNotification({
        nom: requestData.nom,
        prenom: requestData.prenom,
        email: requestData.email,
        telephone: requestData.telephone,
        adresse: requestData.adresse,
        formule: requestData.formule,
        nombreVetements: requestData.nombreVetements,
        valeurMoyenne: requestData.valeurMoyenne,
        marques: requestData.marques,
        description: requestData.description,
        estimation: requestData.estimation,
      });
      if (!emailResult.success) {
        console.error(
          '[Appointment Request API] Email sending failed for',
          requestData.email,
          '-',
          emailResult.error || emailResult.message
        );
      }
    } else {
      console.warn(
        '[Appointment Request API] BREVO_API_KEY is not set: email notification skipped.'
      );
    }

    return NextResponse.json({
      success: true,
      requestId: dbResult.requestId,
      message: 'Votre demande a été envoyée avec succès. Nous vous recontacterons sous 24h.'
    });
  } catch (error) {
    console.error('[Appointment Request API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
