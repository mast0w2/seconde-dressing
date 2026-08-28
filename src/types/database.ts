export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          service_type: 'drop-off' | 'wardrobe-sorting';
          date: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type: 'drop-off' | 'wardrobe-sorting';
          date: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_type?: 'drop-off' | 'wardrobe-sorting';
          date?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Booking = Tables<'bookings'>;
export type InsertBooking = InsertTables<'bookings'>;
export type UpdateBooking = UpdateTables<'bookings'>;
