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
      organizations: {
        Row: {
          id: number
          code: string
          name: string
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: number
          code: string
          name: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: number
          code?: string
          name?: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      branches: {
        Row: {
          id: number
          code: string
          name: string
          organization_id: number
          phone: string | null
          address: string | null
          manager_id: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: number
          code: string
          name: string
          organization_id: number
          phone?: string | null
          address?: string | null
          manager_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: number
          code?: string
          name?: string
          organization_id?: number
          phone?: string | null
          address?: string | null
          manager_id?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
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
      v_branches: {
        Row: {
            id: number;
            code: string;
            name: string;
            organization_id: number;
            organization_name: string | null;
            phone: string | null;
            address: string | null;
            is_active: boolean;
            created_at: string;
            updated_at: string | null;
            created_by_name: string | null;
            updated_by_name: string | null;
            manager_name: string | null;
            notes: string | null;
        }
      }
      v_organizations: {
        Row: {
            id: number;
            name: string;
        }
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