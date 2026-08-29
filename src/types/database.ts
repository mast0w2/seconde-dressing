// src/types/database.ts
// TypeScript type definitions for Supabase database tables
// Generated from Supabase schema with additional business logic types

// ============================================================================
// Base Types
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================================
// Enums and Constants
// ============================================================================

/** User roles in the application */
export type Role = 'client' | 'vendeuse';

/** Disponibilite (availability) status */
export type StatutDisponibilite = 'disponible' | 'reserve';

/** RendezVous (appointment) status */
export type StatutRendezVous = 'en_attente' | 'accepte' | 'refuse' | 'annule';

/** Language preferences */
export type Langue = 'FR' | 'EN';

/** Theme preferences */
export type Theme = 'clair' | 'sombre';

// ============================================================================
// Database Tables Types
// ============================================================================

// ============================================================================
// profiles table
// ============================================================================

export interface Profile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  photo_url: string | null;
  role: Role;
  created_at: string;
  bio: string | null;
  specialisation: string | null;
  tarif_horaire: number | null;
  annees_experience: number | null;
}

export interface InsertProfile {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  photo_url?: string | null;
  role: Role;
  created_at?: string;
  bio?: string | null;
  specialisation?: string | null;
  tarif_horaire?: number | null;
  annees_experience?: number | null;
}

export interface UpdateProfile {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
  photo_url?: string | null;
  role?: Role;
  created_at?: string;
  bio?: string | null;
  specialisation?: string | null;
  tarif_horaire?: number | null;
  annees_experience?: number | null;
}

// ============================================================================
// disponibilites table
// ============================================================================

export interface Disponibilite {
  id: string;
  user_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut: StatutDisponibilite;
  est_recurrent: boolean;
  jour_recurrence: string | null;
  created_at: string;
}

export interface InsertDisponibilite {
  id?: string;
  user_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut?: StatutDisponibilite;
  est_recurrent?: boolean;
  jour_recurrence?: string | null;
  created_at?: string;
}

export interface UpdateDisponibilite {
  id?: string;
  user_id?: string;
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
  statut?: StatutDisponibilite;
  est_recurrent?: boolean;
  jour_recurrence?: string | null;
  created_at?: string;
}

// ============================================================================
// rendez_vous table
// ============================================================================

export interface RendezVous {
  id: string;
  client_id: string;
  vendeuse_id: string;
  disponibilite_id: string;
  statut: StatutRendezVous;
  date: string;
  heure_debut: string;
  heure_fin: string;
  cree_le: string;
  mis_a_jour_le: string;
}

export interface InsertRendezVous {
  id?: string;
  client_id: string;
  vendeuse_id: string;
  disponibilite_id: string;
  statut?: StatutRendezVous;
  date: string;
  heure_debut: string;
  heure_fin: string;
  cree_le?: string;
  mis_a_jour_le?: string;
}

export interface UpdateRendezVous {
  id?: string;
  client_id?: string;
  vendeuse_id?: string;
  disponibilite_id?: string;
  statut?: StatutRendezVous;
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
  cree_le?: string;
  mis_a_jour_le?: string;
}

// ============================================================================
// reviews table
// ============================================================================

export interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface InsertReview {
  id?: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export interface UpdateReview {
  id?: string;
  client_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

// ============================================================================
// contact_messages table
// ============================================================================

export type ContactMessageStatus = 'pending' | 'read' | 'resolved';

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
// preferences table
// ============================================================================

export interface Preference {
  id: string;
  user_id: string;
  langue: Langue;
  theme: Theme;
  notifications_email: boolean;
  created_at: string;
}

export interface InsertPreference {
  id?: string;
  user_id: string;
  langue?: Langue;
  theme?: Theme;
  notifications_email?: boolean;
  created_at?: string;
}

export interface UpdatePreference {
  id?: string;
  user_id?: string;
  langue?: Langue;
  theme?: Theme;
  notifications_email?: boolean;
  created_at?: string;
}

// ============================================================================
// Business Logic Types
// ============================================================================

/** Extended RendezVous with related data */
export interface ExtendedRendezVous extends RendezVous {
  client?: Profile;
  vendeuse?: Profile;
  disponibilite?: Disponibilite;
}

/** Dashboard statistics */
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
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
  client_name: string;
  rating: number;
  comment: string;
}

/** Disponibilite form data */
export interface DisponibiliteFormData {
  date: string;
  heure_debut: string;
  heure_fin: string;
  est_recurrent: boolean;
  jour_recurrence?: string;
}

/** Profile form data for client */
export interface ClientProfileFormData {
  nom: string;
  prenom: string;
  telephone?: string;
  bio?: string;
}

/** Profile form data for vendeuse */
export interface VendeuseProfileFormData extends ClientProfileFormData {
  specialisation: string;
  tarif_horaire: number;
  annees_experience: number;
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
      disponibilites: {
        Row: Disponibilite;
        Insert: InsertDisponibilite;
        Update: UpdateDisponibilite;
      };
      rendez_vous: {
        Row: RendezVous;
        Insert: InsertRendezVous;
        Update: UpdateRendezVous;
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
      preferences: {
        Row: Preference;
        Insert: InsertPreference;
        Update: UpdatePreference;
      };
    };
  };
}
