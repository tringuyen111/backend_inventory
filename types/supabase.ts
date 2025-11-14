export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
        }
        // FIX: Added Relationships to ensure proper type inference by the Supabase client.
        Relationships: []
      }
      warehouses: {
        Row: {
          id: number
          code: string
          name: string
          is_active: boolean
        }
        Insert: {
          id?: number
          code: string
          name: string
          is_active?: boolean
        }
        Update: {
          id?: number
          code?: string
          name?: string
          is_active?: boolean
        }
        // FIX: Added Relationships to ensure proper type inference by the Supabase client.
        Relationships: []
      }
      products: {
        Row: {
          id: number
          code: string
          name: string
          sku: string | null
          min_stock_level: number
        }
        Insert: {
          id?: number
          code: string
          name: string
          sku?: string | null
          min_stock_level?: number
        }
        Update: {
          id?: number
          code?: string
          name?: string
          sku?: string | null
          min_stock_level?: number
        }
        // FIX: Added Relationships to ensure proper type inference by the Supabase client.
        Relationships: []
      }
      stock_summary: {
        Row: {
          product_id: number
          quantity_available: number
        }
        Insert: {
          product_id: number
          quantity_available?: number
        }
        Update: {
          product_id?: number
          quantity_available?: number
        }
        // FIX: Added Relationships to ensure proper type inference by the Supabase client.
        Relationships: []
      }
    }
    Views: {
      v_organizations: {
        Row: {
          id: number
          code: string
          name: string
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          created_by_name: string | null
        }
        // Note: Views are read-only, so they don't have Insert/Update types.
        // FIX: Added Relationships property to the view. The Supabase client's type inference
        // requires this property on all tables and views, even if empty, to function correctly.
        Relationships: []
      }
    }
    Functions: {
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_dashboard_kpis: {
        // FIX: Changed the argument from optional to required but nullable.
        // The optional '?' syntax was causing type inference to fail, resulting in 'never'.
        Args: { p_warehouse_id: number | null }
        Returns: {
          total_skus: number
          total_on_hand: number
          total_reserved: number
          total_available: number
          low_stock_items: number
          expiring_soon: number
        }[]
      }
    }
  }
}