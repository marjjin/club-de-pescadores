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
          email: string | null
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      anglers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          dni: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          dni: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          dni?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      annual_tables: {
        Row: {
          id: string
          name: string
          year: number
          archived_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          year: number
          archived_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          year?: number
          archived_at?: string | null
          created_by?: string
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
          tournament_id: string | null
          show_time: boolean
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
          tournament_id?: string | null
          show_time?: boolean
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
          tournament_id?: string | null
          show_time?: boolean
        }
        Relationships: []
      }
      facilities: {
        Row: {
          id: string
          position: number
          name: string
          description: string
          image_path: string | null
          default_image: string | null
          image_alt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          position: number
          name: string
          description: string
          image_path?: string | null
          default_image?: string | null
          image_alt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position?: number
          name?: string
          description?: string
          image_path?: string | null
          default_image?: string | null
          image_alt?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      facility_sections: {
        Row: {
          id: number
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          id: string
          news_id: string | null
          pier_report_id: string | null
          position: number
          kind: string
          path: string
          poster_path: string | null
          width: number
          height: number
          alt: string
          created_at: string
        }
        Insert: {
          id?: string
          news_id?: string | null
          pier_report_id?: string | null
          position: number
          kind: string
          path: string
          poster_path?: string | null
          width: number
          height: number
          alt: string
          created_at?: string
        }
        Update: {
          id?: string
          news_id?: string | null
          pier_report_id?: string | null
          position?: number
          kind?: string
          path?: string
          poster_path?: string | null
          width?: number
          height?: number
          alt?: string
          created_at?: string
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
          image_focus_x: number
          image_focus_y: number
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
          image_focus_x?: number
          image_focus_y?: number
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
          image_focus_x?: number
          image_focus_y?: number
        }
        Relationships: []
      }
      permissions: {
        Row: { id: string; label: string; reserved: boolean }
        Insert: { id: string; label: string; reserved?: boolean }
        Update: { id?: string; label?: string; reserved?: boolean }
        Relationships: []
      }
      pier_reports: {
        Row: {
          id: string
          height_cm: number
          measured_at: string
          conditions: string | null
          is_published: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          height_cm: number
          measured_at: string
          conditions?: string | null
          is_published?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          height_cm?: number
          measured_at?: string
          conditions?: string | null
          is_published?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
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
      river_levels: {
        Row: {
          id: number
          height_cm: number
          measured_at: string
          station: string
          source: string
          note: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          height_cm: number
          measured_at: string
          station: string
          source: string
          note?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          height_cm?: number
          measured_at?: string
          station?: string
          source?: string
          note?: string | null
          is_published?: boolean
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
      tournament_categories: {
        Row: {
          id: string
          name: string
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_category_links: {
        Row: {
          id: string
          tournament_id: string
          category_id: string
          annual_table_id: string | null
        }
        Insert: {
          id?: string
          tournament_id: string
          category_id: string
          annual_table_id?: string | null
        }
        Update: {
          id?: string
          tournament_id?: string
          category_id?: string
          annual_table_id?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          tournament_id: string
          display_name: string
          consent_at: string
          points: number
          deleted_at: string | null
          created_by: string
          created_at: string
          updated_at: string
          angler_id: string | null
          category_id: string
        }
        Insert: {
          id?: string
          tournament_id: string
          display_name: string
          consent_at: string
          points?: number
          deleted_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          angler_id?: string | null
          category_id: string
        }
        Update: {
          id?: string
          tournament_id?: string
          display_name?: string
          consent_at?: string
          points?: number
          deleted_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          angler_id?: string | null
          category_id?: string
        }
        Relationships: []
      }
      tournament_scores: {
        Row: {
          id: string
          tournament_id: string
          participant_id: string
          points: number
          reason: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          participant_id: string
          points: number
          reason?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          participant_id?: string
          points?: number
          reason?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          id: string
          name: string
          place: string | null
          starts_on: string
          ends_on: string | null
          status: string
          created_by: string
          created_at: string
          updated_at: string
          start_time: string | null
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          place?: string | null
          starts_on: string
          ends_on?: string | null
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
          start_time?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          place?: string | null
          starts_on?: string
          ends_on?: string | null
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          start_time?: string | null
          description?: string | null
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
      admin_delete_news: {
        Args: { p_id: string | null; p_version: string | null }
        Returns: string
      }
      admin_delete_role: {
        Args: { p_id: string | null; p_version: string | null }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { p_id: string | null; p_version: string | null }
        Returns: undefined
      }
      admin_get_facilities: { Args: Record<never, never>; Returns: Json }
      admin_get_river_level: { Args: Record<never, never>; Returns: Json }
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
      admin_prune_club_media: { Args: Record<never, never>; Returns: string[] }
      admin_save_content: {
        Args: {
          p_kind: string | null
          p_data: Json | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: Json
      }
      admin_save_facilities: {
        Args: { p_data: Json | null; p_version: string | null }
        Returns: Json
      }
      admin_save_river_level: {
        Args: { p_data: Json | null; p_version?: string | null }
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
      admin_unused_news_images: {
        Args: Record<never, never>
        Returns: string[]
      }
      angler_get: { Args: { p_id: string | null }; Returns: Json }
      angler_save: {
        Args: {
          p_data: Json | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: Json
      }
      angler_search: { Args: { p_query: string | null }; Returns: Json }
      annual_standings: {
        Args: { p_table: string | null; p_category: string | null }
        Returns: Json
      }
      annual_table_archive: {
        Args: { p_id: string | null; p_archived: boolean | null }
        Returns: undefined
      }
      annual_table_get: { Args: { p_id: string | null }; Returns: Json }
      annual_table_list: { Args: Record<never, never>; Returns: Json }
      annual_table_save: {
        Args: {
          p_name: string | null
          p_year: number | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: string
      }
      annual_tables_public: { Args: Record<never, never>; Returns: Json }
      bootstrap_admin: { Args: { p_email: string | null }; Returns: string }
      can_manage_media: { Args: Record<never, never>; Returns: boolean }
      club_media_in_use: { Args: { p_name: string | null }; Returns: boolean }
      has_permission: {
        Args: { p_permission: string | null }
        Returns: boolean
      }
      news_image_in_use: { Args: { p_name: string | null }; Returns: boolean }
      pier_delete_report: { Args: { p_id: string | null }; Returns: string[] }
      pier_publish_report: { Args: { p_data: Json | null }; Returns: Json }
      pier_recent_reports: {
        Args: { p_before?: string | null; p_id?: string | null }
        Returns: Json
      }
      pier_set_report_published: {
        Args: { p_id: string | null; p_published: boolean | null }
        Returns: undefined
      }
      tournament_add_participant: {
        Args: {
          p_tournament: string | null
          p_category: string | null
          p_angler: string | null
          p_consent: boolean | null
        }
        Returns: string
      }
      tournament_add_points: {
        Args: {
          p_participant: string | null
          p_points: number | null
          p_reason?: string | null
        }
        Returns: number
      }
      tournament_admin_get: { Args: { p_id: string | null }; Returns: Json }
      tournament_admin_list: {
        Args: { p_before?: string | null; p_id?: string | null }
        Returns: Json
      }
      tournament_admin_participants: {
        Args: {
          p_tournament: string | null
          p_search?: string | null
          p_points?: number | null
          p_name?: string | null
          p_id?: string | null
          p_category?: string | null
        }
        Returns: Json
      }
      tournament_board_categories: {
        Args: { p_tournament: string | null }
        Returns: Json
      }
      tournament_category_archive: {
        Args: { p_id: string | null; p_archived: boolean | null }
        Returns: undefined
      }
      tournament_category_list: { Args: Record<never, never>; Returns: Json }
      tournament_category_save: {
        Args: {
          p_name: string | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: string
      }
      tournament_change_participant: {
        Args: {
          p_id: string | null
          p_angler: string | null
          p_consent: boolean | null
        }
        Returns: undefined
      }
      tournament_delete: {
        Args: { p_id: string | null; p_version: string | null }
        Returns: undefined
      }
      tournament_leaderboard: {
        Args: {
          p_tournament: string | null
          p_points?: number | null
          p_name?: string | null
          p_id?: string | null
          p_category?: string | null
        }
        Returns: Json
      }
      tournament_move_participant: {
        Args: { p_id: string | null; p_category: string | null }
        Returns: undefined
      }
      tournament_remove_participant: {
        Args: { p_id: string | null }
        Returns: undefined
      }
      tournament_rename_participant: {
        Args: { p_id: string | null; p_name: string | null }
        Returns: undefined
      }
      tournament_save: {
        Args: {
          p_data: Json | null
          p_id?: string | null
          p_version?: string | null
        }
        Returns: string
      }
      tournament_set_status: {
        Args: { p_id: string | null; p_status: string | null }
        Returns: undefined
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
