// Generated from the applied local PostgreSQL migrations. Do not edit manually.
// Regenerate: npm run db:types. Compare with Supabase-generated types after remote migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
export type Database = {
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          id: string
          email: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          resource_id: string
          before_data: Json | null
          after_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          resource_id: string
          before_data?: Json | null
          after_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          resource_id?: string
          before_data?: Json | null
          after_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          starts_at: string
          place: string
          is_published: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
          description: string | null
        }
        Insert: {
          id?: string
          title: string
          starts_at: string
          place: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          description?: string | null
        }
        Update: {
          id?: string
          title?: string
          starts_at?: string
          place?: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          description?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          id: string
          title: string
          excerpt: string
          published_at: string
          image_url: string
          image_alt: string
          is_published: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          excerpt: string
          published_at?: string
          image_url: string
          image_alt: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          excerpt?: string
          published_at?: string
          image_url?: string
          image_alt?: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: { id: string; label: string; reserved: boolean }
        Insert: { id: string; label: string; reserved?: boolean }
        Update: { id?: string; label?: string; reserved?: boolean }
        Relationships: []
      }
      pool_rates: {
        Row: {
          id: string
          season: string
          period: string
          family_price_cents: number
          individual_price_cents: number
          family_description: string
          discount_note: string | null
          valid_from: string
          valid_until: string | null
          is_published: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season: string
          period: string
          family_price_cents: number
          individual_price_cents: number
          family_description: string
          discount_note?: string | null
          valid_from: string
          valid_until?: string | null
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season?: string
          period?: string
          family_price_cents?: number
          individual_price_cents?: number
          family_description?: string
          discount_note?: string | null
          valid_from?: string
          valid_until?: string | null
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: { role_id: string; permission_id: string }
        Insert: { role_id: string; permission_id: string }
        Update: { role_id?: string; permission_id?: string }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: { user_id: string; role_id: string }
        Insert: { user_id: string; role_id: string }
        Update: { user_id?: string; role_id?: string }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      admin_allow_invitation: { Args: Record<never, never>; Returns: boolean }
      admin_archive_content: {
        Args: {
          p_kind: string | null
          p_id: string | null
          p_version: string | null
          p_restore: boolean | null
        }
        Returns: undefined
      }
      admin_context: { Args: Record<never, never>; Returns: Json }
      admin_dashboard: { Args: Record<never, never>; Returns: Json }
      admin_delete_role: {
        Args: { p_id: string | null; p_version: string | null }
        Returns: undefined
      }
      admin_invitation_target: {
        Args: { p_email: string | null; p_roles: string[] | null }
        Returns: Json
      }
      admin_list: {
        Args: {
          p_kind: string | null
          p_before?: string | null
          p_id?: string | null
          p_state?: string | null
          p_search?: string | null
        }
        Returns: Json
      }
      admin_permissions: { Args: Record<never, never>; Returns: Json }
      admin_save_content: {
        Args: {
          p_kind: string | null
          p_data: Json | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: Json
      }
      admin_save_role: {
        Args: {
          p_name: string | null
          p_permissions: string[] | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: string
      }
      admin_save_user: {
        Args: {
          p_id: string | null
          p_roles: string[] | null
          p_active: boolean | null
          p_version?: string | null
        }
        Returns: undefined
      }
      bootstrap_admin: { Args: { p_email: string | null }; Returns: string }
      has_permission: {
        Args: { p_permission: string | null }
        Returns: boolean
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
