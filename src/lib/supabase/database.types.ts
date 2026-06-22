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
          name: string;
          full_title: string;
          slug: string;
          short_description: string | null;
          summary: string | null;
          edital: string | null;
          registration_number: string | null;
          approved_amount: number;
          executed_amount: number;
          status: string;
          current_stage: string | null;
          modality: string | null;
          class_name: string | null;
          proponent: string | null;
          proponent_document: string | null;
          city: string | null;
          state: string | null;
          start_date: string | null;
          end_date: string | null;
          cover_url: string | null;
          banner_url: string | null;
          notes: string | null;
          archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          full_title: string;
          slug: string;
          short_description?: string | null;
          summary?: string | null;
          edital?: string | null;
          registration_number?: string | null;
          approved_amount?: number;
          executed_amount?: number;
          status?: string;
          current_stage?: string | null;
          modality?: string | null;
          class_name?: string | null;
          proponent?: string | null;
          proponent_document?: string | null;
          city?: string | null;
          state?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cover_url?: string | null;
          banner_url?: string | null;
          notes?: string | null;
          archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      team_roster: {
        Row: {
          id: string;
          name: string;
          role: string;
          phone: string | null;
          email: string | null;
          document: string | null;
          bio: string | null;
          avatar_url: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          phone?: string | null;
          email?: string | null;
          document?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_roster"]["Insert"]>;
        Relationships: [];
      };
      team_roster_assignments: {
        Row: {
          id: string;
          team_roster_id: string;
          project_id: string;
          expected_amount: number;
          paid_amount: number;
          payment_status: string;
          notes: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          team_roster_id: string;
          project_id: string;
          expected_amount?: number;
          paid_amount?: number;
          payment_status: string;
          notes?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_roster_assignments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "team_roster_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_roster_assignments_team_roster_id_fkey";
            columns: ["team_roster_id"];
            isOneToOne: false;
            referencedRelation: "team_roster";
            referencedColumns: ["id"];
          },
        ];
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
