// src/types/database.ts
// TypeScript type definitions for Supabase database tables
// Updated for Version 2 with full authentication and demande system

// ============================================================================
// Base Types
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================================
// Enums and Constants
// ============================================================================

/** User roles in the application */
export type Role = 'client' | 'vendeur';

/** Demand status */
export type StatutDemande = 'en_attente' | 'acceptee' | 'refusee' | 'articles_recuperes' | 'articles_en_vente' | 'terminee';

/** Disponibilite (availability) status */
export type StatutDisponibilite = 'disponible' | 'reserve';

/** RendezVous (appointment) status */
export type StatutRendezVous = 'en_attente' | 'confirme' | 'annule' | 'termine';

/** Language preferences */
export type Langue = 'FR' | 'EN';

/** Theme preferences */
export type Theme = 'clair' | 'sombre';

/** Contact message status */
export type ContactMessageStatus = 'pending' | 'read' | 'resolved';

/** Estimation status */
export type EstimationStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

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
  // Address fields
  adresse_rue: string | null;
  adresse_ville: string | null;
  adresse_code_postal: string | null;
  adresse_pays: string | null;
  // Role
  role: Role;
  // Professional info (for vendeur)
  bio: string | null;
  specialisation: string | null;
  tarif_horaire: number | null;
  annees_experience: number | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface InsertProfile {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  photo_url?: string | null;
  adresse_rue?: string | null;
  adresse_ville?: string | null;
  adresse_code_postal?: string | null;
  adresse_pays?: string | null;
  role: Role;
  bio?: string | null;
  specialisation?: string | null;
  tarif_horaire?: number | null;
  annees_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfile {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
  photo_url?: string | null;
  adresse_rue?: string | null;
  adresse_ville?: string | null;
  adresse_code_postal?: string | null;
  adresse_pays?: string | null;
  role?: Role;
  bio?: string | null;
  specialisation?: string | null;
  tarif_horaire?: number | null;
  annees_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// demandes table
// ============================================================================

export interface Demande {
  id: string;
  client_id: string;
  client_nom: string;
  client_prenom: string;
  client_email: string;
  client_telephone: string | null;
  type_demande: string;
  message: string;
  statut: StatutDemande;
  vendeur_id: string | null;
  created_at: string;
  updated_at: string;
  date_proposee: string | null;
  heure_proposee: string | null;
  date_confirmee: string | null;
  heure_confirmee: string | null;
}

export interface InsertDemande {
  id?: string;
  client_id: string;
  client_nom: string;
  client_prenom: string;
  client_email: string;
  client_telephone?: string | null;
  type_demande?: string;
  message: string;
  statut?: StatutDemande;
  vendeur_id?: string | null;
  created_at?: string;
  updated_at?: string;
  date_proposee?: string | null;
  heure_proposee?: string | null;
  date_confirmee?: string | null;
  heure_confirmee?: string | null;
}

export interface UpdateDemande {
  id?: string;
  client_id?: string;
  client_nom?: string;
  client_prenom?: string;
  client_email?: string;
  client_telephone?: string | null;
  type_demande?: string;
  message?: string;
  statut?: StatutDemande;
  vendeur_id?: string | null;
  created_at?: string;
  updated_at?: string;
  date_proposee?: string | null;
  heure_proposee?: string | null;
  date_confirmee?: string | null;
  heure_confirmee?: string | null;
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
  demande_id: string | null;
  client_id: string;
  vendeur_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut: StatutRendezVous;
  created_at: string;
  updated_at: string;
}

export interface InsertRendezVous {
  id?: string;
  demande_id?: string | null;
  client_id: string;
  vendeur_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut?: StatutRendezVous;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateRendezVous {
  id?: string;
  demande_id?: string | null;
  client_id?: string;
  vendeur_id?: string;
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
  statut?: StatutRendezVous;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// reviews table
// ============================================================================

export interface Review {
  id: string;
  client_id: string | null;
  vendeur_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface InsertReview {
  id?: string;
  client_id?: string | null;
  vendeur_id?: string | null;
  rating: number;
  comment: string;
  created_at?: string;
}

export interface UpdateReview {
  id?: string;
  client_id?: string | null;
  vendeur_id?: string | null;
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
// estimation_requests table
// ============================================================================

export interface EstimationRequest {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nombre_vetements: number;
  valeur_moyenne: number;
  marques: string;
  description: string | null;
  estimation: number;
  status: EstimationStatus;
  created_at: string;
}

export interface InsertEstimationRequest {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nombre_vetements: number;
  valeur_moyenne: number;
  marques: string;
  description?: string | null;
  estimation: number;
  status?: EstimationStatus;
  created_at?: string;
}

export interface UpdateEstimationRequest {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  nombre_vetements?: number;
  valeur_moyenne?: number;
  marques?: string;
  description?: string | null;
  estimation?: number;
  status?: EstimationStatus;
  created_at?: string;
}

// ============================================================================
// preferences table
// ============================================================================

export interface Preference {
  id: string;
  user_id: string;
  langue: Langue;
  fuseau_horaire: string;
  theme: Theme;
  notifications_email: boolean;
  notifications_sms: boolean;
  created_at: string;
}

export interface InsertPreference {
  id?: string;
  user_id: string;
  langue?: Langue;
  fuseau_horaire?: string;
  theme?: Theme;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  created_at?: string;
}

export interface UpdatePreference {
  id?: string;
  user_id?: string;
  langue?: Langue;
  fuseau_horaire?: string;
  theme?: Theme;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  created_at?: string;
}

// ============================================================================
// Business Logic Types
// ============================================================================

/** Extended RendezVous with related data */
export interface ExtendedRendezVous extends RendezVous {
  client?: Profile;
  vendeur?: Profile;
  demande?: Demande;
}

/** Dashboard statistics */
export interface DashboardStats {
  totalDemandes: number;
  demandesEnAttente: number;
  demandesAcceptees: number;
  demandesTerminees: number;
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
  nom: string;
  prenom: string;
  telephone: string;
  adresse_rue: string;
  adresse_ville: string;
  adresse_code_postal: string;
  role: Role;
}

/** Profile form data */
export interface ProfileFormData {
  nom: string;
  prenom: string;
  telephone: string;
  bio?: string;
  adresse_rue: string;
  adresse_ville: string;
  adresse_code_postal: string;
  adresse_pays: string;
}

/** Demande RDV form data */
export interface DemandeRdvFormData {
  message: string;
  date_proposee?: string;
  heure_proposee?: string;
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

/** Disponibilite form data */
export interface DisponibiliteFormData {
  date: string;
  heure_debut: string;
  heure_fin: string;
  est_recurrent: boolean;
  jour_recurrence?: string;
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
      demandes: {
        Row: Demande;
        Insert: InsertDemande;
        Update: UpdateDemande;
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
      estimation_requests: {
        Row: EstimationRequest;
        Insert: InsertEstimationRequest;
        Update: UpdateEstimationRequest;
      };
      preferences: {
        Row: Preference;
        Insert: InsertPreference;
        Update: UpdatePreference;
      };
    };
  };
}
