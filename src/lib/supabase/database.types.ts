import type { Role } from "@/lib/auth/permissions";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: Role;
          avatar_url: string | null;
          is_active: boolean;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: Role;
          avatar_url?: string | null;
          is_active?: boolean;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          slug: string;
        };
        Insert: {
          id?: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      project_memberships: {
        Row: {
          profile_id: string;
          project_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          project_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_memberships"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
