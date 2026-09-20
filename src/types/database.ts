// src/types/database.ts
// TypeScript type definitions for Supabase database tables
// English schema (aligned with Notion framing - 11/09/2026)
// Single `requests` table (merged demandes + estimation_requests) + dedicated `formulas` table
// ============================================================================

// Base Types
// ============================================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// Enums and Constants
// ============================================================================

/** User roles in the application */
export type Role = 'client' | 'seller';

/** Request status (merged appointment + estimation workflow) */
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'items_collected'
  | 'items_on_sale'
  | 'completed';

/** Availability status */
export type AvailabilityStatus = 'available' | 'booked';

/** Contact message status */
export type ContactMessageStatus = 'pending' | 'read' | 'resolved';

/** Request type */
export type RequestType = 'appointment' | 'estimation';

/** Language preference */
export type Language = 'FR' | 'EN';

/** Theme preference */
export type Theme = 'light' | 'dark';

/** Formula slugs (priced service formulas) */
export type FormulaSlug = 'pre-sorted' | 'on-site-sorting' | 'sorting-and-advice';

// ============================================================================
// profiles table
// ============================================================================
export interface Profile {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  street_address: string | null;
  role: Role;
  bio: string | null;
  specialization: string | null;
  hourly_rate: number | null;
  years_experience: number | null;
  created_at: string;
  updated_at: string;
}

export interface InsertProfile {
  id?: string;
  last_name: string;
  first_name: string;
  email: string;
  phone?: string | null;
  photo_url?: string | null;
  street_address?: string | null;
  role: Role;
  bio?: string | null;
  specialization?: string | null;
  hourly_rate?: number | null;
  years_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfile {
  id?: string;
  last_name?: string;
  first_name?: string;
  email?: string;
  phone?: string | null;
  photo_url?: string | null;
  street_address?: string | null;
  role?: Role;
  bio?: string | null;
  specialization?: string | null;
  hourly_rate?: number | null;
  years_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// formulas table (priced service formulas)
// ============================================================================
export interface Formula {
  id: string;
  slug: FormulaSlug;
  label: string;
  price: number;
  description: string | null;
  created_at: string;
}

export interface InsertFormula {
  id?: string;
  slug: FormulaSlug;
  label: string;
  price: number;
  description?: string | null;
  created_at?: string;
}

export interface UpdateFormula {
  id?: string;
  slug?: FormulaSlug;
  label?: string;
  price?: number;
  description?: string | null;
  created_at?: string;
}

// ============================================================================
// requests table (merged: appointments + estimation requests)
// ============================================================================
export interface Request {
  id: string;
  client_id: string | null;
  request_type: RequestType;
  message: string | null;
  status: RequestStatus;
  seller_id: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  address: string | null;
  formula_id: string | null;
  conditions_accepted: boolean;
  number_of_items: number | null;
  average_value: number | null;
  brands: string | null;
  description: string | null;
  estimate: number | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertRequest {
  id?: string;
  client_id?: string | null;
  request_type?: RequestType;
  message?: string | null;
  status?: RequestStatus;
  seller_id?: string | null;
  proposed_date?: string | null;
  proposed_time?: string | null;
  confirmed_date?: string | null;
  confirmed_time?: string | null;
  address?: string | null;
  formula_id?: string | null;
  conditions_accepted?: boolean;
  number_of_items?: number | null;
  average_value?: number | null;
  brands?: string | null;
  description?: string | null;
  estimate?: number | null;
  client_first_name?: string | null;
  client_last_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateRequest {
  id?: string;
  client_id?: string | null;
  request_type?: RequestType;
  message?: string | null;
  status?: RequestStatus;
  seller_id?: string | null;
  proposed_date?: string | null;
  proposed_time?: string | null;
  confirmed_date?: string | null;
  confirmed_time?: string | null;
  address?: string | null;
  formula_id?: string | null;
  conditions_accepted?: boolean;
  number_of_items?: number | null;
  average_value?: number | null;
  brands?: string | null;
  description?: string | null;
  estimate?: number | null;
  client_first_name?: string | null;
  client_last_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Request with joined client, seller and formula data */
export interface RequestWithRelations extends Request {
  client?: Profile;
  seller?: Profile | null;
  formula?: Formula | null;
}

// ============================================================================
// request_refusals table (per-seller refusal tracking)
// A refusal does not change the request global status, so another seller can
// still accept it. Each refusal is stored here so the refusing seller stops
// seeing the request as "nouvelle".
// ============================================================================
export interface RequestRefusal {
  id: string;
  request_id: string;
  seller_id: string;
  created_at: string;
}

export interface InsertRequestRefusal {
  id?: string;
  request_id: string;
  seller_id: string;
  created_at?: string;
}

// ============================================================================
// request_items table (clothing items photographed for a request)
// ============================================================================
export interface RequestItem {
  id: string;
  request_id: string;
  photo_url: string;
  description: string | null;
  /** Prix minimal souhaité (cliente ou vendeuse selon la formule), validé par la cliente. */
  min_price: number | null;
  /** Validation du prix minimal par la cliente : verrouille min_price. */
  min_price_validated_at: string | null;
  /** Prix de vente final, renseigné par la vendeuse seule. */
  sale_price: number | null;
  /** Justificatif de vente déposé par la vendeuse. */
  sale_proof_url: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface InsertRequestItem {
  id?: string;
  request_id: string;
  photo_url: string;
  description?: string | null;
  min_price?: number | null;
  created_at?: string;
}

export interface UpdateRequestItem {
  id?: string;
  request_id?: string;
  photo_url?: string;
  description?: string | null;
  min_price?: number | null;
  min_price_validated_at?: string | null;
  sale_price?: number | null;
  sale_proof_url?: string | null;
  sold_at?: string | null;
  created_at?: string;
}

// ============================================================================
// request_contracts table (contrat de dépôt-vente)
// Generated when the seller sets a request to `items_collected`; one per
// request. `content` is a frozen snapshot (see src/lib/contract.ts).
// ============================================================================
export interface RequestContract {
  id: string;
  request_id: string;
  client_id: string | null;
  seller_id: string | null;
  version: string;
  content: ContractContent;
  client_signed_at: string | null;
  client_signature: string | null;
  client_signature_name: string | null;
  seller_signed_at: string | null;
  seller_signature: string | null;
  seller_signature_name: string | null;
  created_at: string;
}

export interface InsertRequestContract {
  id?: string;
  request_id: string;
  client_id?: string | null;
  seller_id?: string | null;
  version: string;
  content: ContractContent;
  client_signed_at?: string | null;
  client_signature?: string | null;
  client_signature_name?: string | null;
  seller_signed_at?: string | null;
  seller_signature?: string | null;
  seller_signature_name?: string | null;
  created_at?: string;
}

export interface UpdateRequestContract {
  client_signed_at?: string | null;
  client_signature?: string | null;
  client_signature_name?: string | null;
  seller_signed_at?: string | null;
  seller_signature?: string | null;
  seller_signature_name?: string | null;
}

/** Ce que la cliente souhaite pour les pièces invendues. */
export type UnsoldItemsChoice = 'return' | 'donate';

/** Identity of one contracting party, as frozen in the contract. */
export interface ContractParty {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

/** Frozen snapshot stored in request_contracts.content. */
export interface ContractContent {
  reference: string;
  generated_at: string;
  client: ContractParty;
  seller: ContractParty;
  formula: { label: string; price: number } | null;
  /**
   * Pièces confiées : seulement le nombre compté à la remise. L'inventaire
   * détaillé (photos, descriptions) vit dans l'espace Seconde et peut être
   * complété après la signature, il ne fait donc pas partie du contrat.
   */
  items: {
    count: number;
  };
  /** Choix de la cliente pour les invendus, saisi par la vendeuse à la remise. */
  unsold_items: UnsoldItemsChoice;
  /** Répartition du prix de vente en pourcentages entiers. */
  split: { cliente: number; vendeuse: number; plateforme: number };
}

// ============================================================================
// preferences table
// ============================================================================
export interface Preference {
  id: string;
  user_id: string;
  language: Language;
  timezone: string;
  theme: Theme;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
}

export interface InsertPreference {
  id?: string;
  user_id: string;
  language?: Language;
  timezone?: string;
  theme?: Theme;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  created_at?: string;
}

export interface UpdatePreference {
  id?: string;
  user_id?: string;
  language?: Language;
  timezone?: string;
  theme?: Theme;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  created_at?: string;
}

// ============================================================================
// availabilityies table
// ============================================================================
export interface Availability {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AvailabilityStatus;
  is_recurring: boolean;
  recurrence_day: string | null;
  created_at: string;
}

export interface InsertAvailability {
  id?: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: AvailabilityStatus;
  is_recurring?: boolean;
  recurrence_day?: string | null;
  created_at?: string;
}

export interface UpdateAvailability {
  id?: string;
  user_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: AvailabilityStatus;
  is_recurring?: boolean;
  recurrence_day?: string | null;
  created_at?: string;
}

// ============================================================================
// reviews table
// ============================================================================
export interface Review {
  id: string;
  client_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface InsertReview {
  id?: string;
  client_id: string;
  seller_id: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export interface UpdateReview {
  id?: string;
  client_id?: string;
  seller_id?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

// ============================================================================
// contact_messages table
// ============================================================================
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
}

export interface InsertContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status?: ContactMessageStatus;
  created_at?: string;
}

export interface UpdateContactMessage {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  subject?: string;
  message?: string;
  status?: ContactMessageStatus;
  created_at?: string;
}

// ============================================================================
// Business Logic Types
// ============================================================================

/** Dashboard statistics */
export interface DashboardStats {
  total: number;
  pending: number;
  accepted: number;
  refused: number;
  in_progress: number;
  completed: number;
}

/** Select option for form inputs */
export interface SelectOption {
  value: string;
  label: string;
}

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}

// ============================================================================
// Form Types
// ============================================================================

/** Signup form data */
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  street_address: string;
  role: Role;
}

/** Profile form data */
export interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  bio?: string;
  street_address: string;
}

/** Demande RDV form data */
export interface DemandeRdvFormData {
  message: string;
  proposed_date?: string;
  proposed_time?: string;
  address: string;
  formula_id: string;
  conditions_accepted: boolean;
}

/** Contact form data */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/** Review form data */
export interface ReviewFormData {
  rating: number;
  comment: string;
}

/** Availability form data */
export interface AvailabilityFormData {
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_day?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Make all properties optional except specified keys */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Make all properties nullable */
export type Nullable<T> = { [P in keyof T]: T[P] | null };

/** Deep partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// Database Type (for Supabase client usage)
// ============================================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: InsertProfile;
        Update: UpdateProfile;
      };
      formulas: {
        Row: Formula;
        Insert: InsertFormula;
        Update: UpdateFormula;
      };
      requests: {
        Row: Request;
        Insert: InsertRequest;
        Update: UpdateRequest;
      };
      request_items: {
        Row: RequestItem;
        Insert: InsertRequestItem;
        Update: UpdateRequestItem;
      };
      request_contracts: {
        Row: RequestContract;
        Insert: InsertRequestContract;
        Update: UpdateRequestContract;
      };
      preferences: {
        Row: Preference;
        Insert: InsertPreference;
        Update: UpdatePreference;
      };
      availabilityies: {
        Row: Availability;
        Insert: InsertAvailability;
        Update: UpdateAvailability;
      };
      reviews: {
        Row: Review;
        Insert: InsertReview;
        Update: UpdateReview;
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: InsertContactMessage;
        Update: UpdateContactMessage;
      };
    };
  };
}
