export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      brand_overrides: {
        Row: {
          booster_mode: string
          booster_started_at: string | null
          created_at: string
          emoji: string | null
          is_active: boolean
          slug: string
          sort_order: number
          target_amount: number
          updated_at: string
          virtual_score: number
        }
        Insert: {
          booster_mode?: string
          booster_started_at?: string | null
          created_at?: string
          emoji?: string | null
          is_active?: boolean
          slug: string
          sort_order?: number
          target_amount?: number
          updated_at?: string
          virtual_score?: number
        }
        Update: {
          booster_mode?: string
          booster_started_at?: string | null
          created_at?: string
          emoji?: string | null
          is_active?: boolean
          slug?: string
          sort_order?: number
          target_amount?: number
          updated_at?: string
          virtual_score?: number
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          external_sku: string | null
          flavor: string | null
          id: string
          mode: string
          price_per_unit: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          external_sku?: string | null
          flavor?: string | null
          id?: string
          mode?: string
          price_per_unit: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          external_sku?: string | null
          flavor?: string | null
          id?: string
          mode?: string
          price_per_unit?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      category_overrides: {
        Row: {
          created_at: string
          emoji: string | null
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_comment: string | null
          comment: string | null
          created_at: string | null
          customer_name: string
          id: string
          phone: string
          product_id: string | null
          product_name: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
          waiting_for_discount: boolean
        }
        Insert: {
          admin_comment?: string | null
          comment?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          phone: string
          product_id?: string | null
          product_name: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
          waiting_for_discount?: boolean
        }
        Update: {
          admin_comment?: string | null
          comment?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          phone?: string
          product_id?: string | null
          product_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
          waiting_for_discount?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_probability: number | null
          brand_id: string | null
          buynow_count: number
          category: string | null
          category_id: string | null
          cooldown_minutes: number | null
          created_at: string | null
          description: string | null
          flavors: Json | null
          id: string
          images: Json | null
          is_manual: boolean | null
          is_qa_only: boolean
          last_increment_at: string | null
          link: string | null
          max_weekly_participants: number | null
          name: string
          pending_prices: Json | null
          prices: Json
          pricing_participants_count: number | null
          real_orders_count: number
          total_orders_count: number | null
          updated_at: string | null
          variants: Json | null
          virtual_orders_count: number
          waiting_for_discount_count: number
          week_start_date: string | null
          weight: string
        }
        Insert: {
          base_probability?: number | null
          brand_id?: string | null
          buynow_count?: number
          category?: string | null
          category_id?: string | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          flavors?: Json | null
          id?: string
          images?: Json | null
          is_manual?: boolean | null
          is_qa_only?: boolean
          last_increment_at?: string | null
          link?: string | null
          max_weekly_participants?: number | null
          name: string
          pending_prices?: Json | null
          prices?: Json
          pricing_participants_count?: number | null
          real_orders_count?: number
          total_orders_count?: number | null
          updated_at?: string | null
          variants?: Json | null
          virtual_orders_count?: number
          waiting_for_discount_count?: number
          week_start_date?: string | null
          weight: string
        }
        Update: {
          base_probability?: number | null
          brand_id?: string | null
          buynow_count?: number
          category?: string | null
          category_id?: string | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          flavors?: Json | null
          id?: string
          images?: Json | null
          is_manual?: boolean | null
          is_qa_only?: boolean
          last_increment_at?: string | null
          link?: string | null
          max_weekly_participants?: number | null
          name?: string
          pending_prices?: Json | null
          prices?: Json
          pricing_participants_count?: number | null
          real_orders_count?: number
          total_orders_count?: number | null
          updated_at?: string | null
          variants?: Json | null
          virtual_orders_count?: number
          waiting_for_discount_count?: number
          week_start_date?: string | null
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_blocked: boolean | null
          last_login_at: string | null
          last_name: string | null
          locked_until: string | null
          login_attempts: number | null
          phone: string | null
          profile_completed: boolean | null
          registration_method: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          phone?: string | null
          profile_completed?: boolean | null
          registration_method?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          phone?: string | null
          profile_completed?: boolean | null
          registration_method?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          tier_bonus: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          tier_bonus?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tier_bonus?: number
          updated_at?: string
        }
        Relationships: []
      }
      socios_product_overrides: {
        Row: {
          created_at: string
          is_active: boolean
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_orders: {
        Row: {
          admin_notes: string | null
          collective_close_date: string | null
          created_at: string
          delivery_address: Json | null
          delivery_cost: number
          discount_amount: number
          discount_percentage: number | null
          id: string
          is_promo: boolean | null
          items: Json
          notes: string | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"]
          participants_count: number | null
          payment_method: string | null
          promo_code: string | null
          promo_tier: number | null
          status: Database["public"]["Enums"]["extended_order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          collective_close_date?: string | null
          created_at?: string
          delivery_address?: Json | null
          delivery_cost?: number
          discount_amount?: number
          discount_percentage?: number | null
          id?: string
          is_promo?: boolean | null
          items?: Json
          notes?: string | null
          order_number: string
          order_type?: Database["public"]["Enums"]["order_type"]
          participants_count?: number | null
          payment_method?: string | null
          promo_code?: string | null
          promo_tier?: number | null
          status?: Database["public"]["Enums"]["extended_order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          collective_close_date?: string | null
          created_at?: string
          delivery_address?: Json | null
          delivery_cost?: number
          discount_amount?: number
          discount_percentage?: number | null
          id?: string
          is_promo?: boolean | null
          items?: Json
          notes?: string | null
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          participants_count?: number | null
          payment_method?: string | null
          promo_code?: string | null
          promo_tier?: number | null
          status?: Database["public"]["Enums"]["extended_order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiting_list_items: {
        Row: {
          created_at: string
          current_price_per_unit: number
          flavor: string | null
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_price_per_unit: number
          flavor?: string | null
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_price_per_unit?: number
          flavor?: string | null
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_invite_tokens: {
        Row: {
          created_at: string
          lead_id: string
          token: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          lead_id: string
          token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          lead_id?: string
          token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_invite_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "wholesale_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_leads: {
        Row: {
          admin_notes: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: { Args: { user_email: string }; Returns: string }
      claim_wholesale_invite: { Args: { _token: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_wholesale_invite: { Args: { _lead_id: string }; Returns: string }
      get_collective_clock: {
        Args: never
        Returns: {
          next_collective_close: string
          server_now: string
        }[]
      }
      get_collective_cycle_close: {
        Args: { _reference?: string }
        Returns: string
      }
      get_collective_stage_debug_state_for_product: {
        Args: { _product_id: string }
        Returns: {
          completed_pending_orders: number
          total_pending_orders: number
          waiting_stage_complete: boolean
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      order_items_product_qty: {
        Args: { _items: Json }
        Returns: {
          product_id: string
          qty: number
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_waiting_for_discount_counts: { Args: never; Returns: undefined }
      set_collective_stage_complete_for_product: {
        Args: { _complete: boolean; _product_id: string }
        Returns: number
      }
      validate_promo_code: {
        Args: { _code: string }
        Returns: {
          code: string
          tier_bonus: number
        }[]
      }
      validate_wholesale_invite: {
        Args: { _token: string }
        Returns: {
          full_name: string
          lead_id: string
          phone: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "mayorista"
      extended_order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      order_status: "new" | "processing" | "completed"
      order_type: "immediate" | "collective" | "mayorista"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "mayorista"],
      extended_order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      order_status: ["new", "processing", "completed"],
      order_type: ["immediate", "collective", "mayorista"],
    },
  },
} as const
