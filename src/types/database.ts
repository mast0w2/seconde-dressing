export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = 'client' | 'vendeuse';
export type StatutDisponibilite = 'disponible' | 'reserve';
export type StatutRendezVous = 'en_attente' | 'accepte' | 'refuse' | 'annule';
export type Langue = 'FR' | 'EN';
export type Theme = 'clair' | 'sombre';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
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
        };
        Update: {
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
        };
      };
      disponibilites: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          heure_debut: string;
          heure_fin: string;
          statut: StatutDisponibilite;
          est_recurrent: boolean;
          jour_recurrence: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          heure_debut: string;
          heure_fin: string;
          statut?: StatutDisponibilite;
          est_recurrent?: boolean;
          jour_recurrence?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          heure_debut?: string;
          heure_fin?: string;
          statut?: StatutDisponibilite;
          est_recurrent?: boolean;
          jour_recurrence?: string | null;
          created_at?: string;
        };
      };
      rendez_vous: {
        Row: {
          id: string;
          client_id: string;
          vendeuse_id: string;
          disponibilite_id: string;
          statut: StatutRendezVous;
          cree_le: string;
          mis_a_jour_le: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          vendeuse_id: string;
          disponibilite_id: string;
          statut?: StatutRendezVous;
          cree_le?: string;
          mis_a_jour_le?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          vendeuse_id?: string;
          disponibilite_id?: string;
          statut?: StatutRendezVous;
          cree_le?: string;
          mis_a_jour_le?: string;
        };
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          langue: Langue;
          fuseau_horaire: string;
          theme: Theme;
          notifications_email: boolean;
          notifications_sms: boolean;
          preferences_ventes: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          langue?: Langue;
          fuseau_horaire?: string;
          theme?: Theme;
          notifications_email?: boolean;
          notifications_sms?: boolean;
          preferences_ventes?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          langue?: Langue;
          fuseau_horaire?: string;
          theme?: Theme;
          notifications_email?: boolean;
          notifications_sms?: boolean;
          preferences_ventes?: Json | null;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export type Disponibilite = Database['public']['Tables']['disponibilites']['Row'];
export type InsertDisponibilite = Database['public']['Tables']['disponibilites']['Insert'];
export type UpdateDisponibilite = Database['public']['Tables']['disponibilites']['Update'];

export type RendezVous = Database['public']['Tables']['rendez_vous']['Row'];
export type InsertRendezVous = Database['public']['Tables']['rendez_vous']['Insert'];
export type UpdateRendezVous = Database['public']['Tables']['rendez_vous']['Update'];

export type Preference = Database['public']['Tables']['preferences']['Row'];
export type InsertPreference = Database['public']['Tables']['preferences']['Insert'];
export type UpdatePreference = Database['public']['Tables']['preferences']['Update'];
