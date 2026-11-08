// Generated from the applied local PostgreSQL migrations. Do not edit manually.
// Regenerate: npm run db:types. Compare with Supabase-generated types after remote migration.
export type Database = {
  public: {
    Tables: {
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
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
