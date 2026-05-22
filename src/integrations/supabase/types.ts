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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          category: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          price_ghs: number
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_ghs: number
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_ghs?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      booking_add_ons: {
        Row: {
          add_on_id: string
          booking_id: string
          id: string
          quantity: number
          total_price_ghs: number
          unit_price_ghs: number
        }
        Insert: {
          add_on_id: string
          booking_id: string
          id?: string
          quantity?: number
          total_price_ghs: number
          unit_price_ghs: number
        }
        Update: {
          add_on_id?: string
          booking_id?: string
          id?: string
          quantity?: number
          total_price_ghs?: number
          unit_price_ghs?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_add_ons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_audit_log: {
        Row: {
          booking_id: string
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          booking_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          booking_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_check_in: string | null
          actual_check_out: string | null
          add_ons_total_ghs: number
          adults: number
          arrival_time: string | null
          base_total_ghs: number
          booking_source: string
          cancellation_policy_id: string | null
          check_in: string
          check_out: string
          children: number
          created_at: string
          discount_ghs: number
          final_total_ghs: number
          guest_id: string | null
          id: string
          nationality: string | null
          ota_reference: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          promo_code: string | null
          reference_code: string
          room_id: string
          room_number: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          add_ons_total_ghs?: number
          adults?: number
          arrival_time?: string | null
          base_total_ghs: number
          booking_source?: string
          cancellation_policy_id?: string | null
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          discount_ghs?: number
          final_total_ghs: number
          guest_id?: string | null
          id?: string
          nationality?: string | null
          ota_reference?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code?: string | null
          reference_code: string
          room_id: string
          room_number?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          add_ons_total_ghs?: number
          adults?: number
          arrival_time?: string | null
          base_total_ghs?: number
          booking_source?: string
          cancellation_policy_id?: string | null
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          discount_ghs?: number
          final_total_ghs?: number
          guest_id?: string | null
          id?: string
          nationality?: string | null
          ota_reference?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code?: string | null
          reference_code?: string
          room_id?: string
          room_number?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancellation_policy_id_fkey"
            columns: ["cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          deadline_hours: number
          description: string | null
          id: string
          is_default: boolean
          name: string
          refund_percentage: number
        }
        Insert: {
          deadline_hours?: number
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          refund_percentage?: number
        }
        Update: {
          deadline_hours?: number
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          refund_percentage?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean
          message: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean
          message: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean
          message?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          guest_id: string | null
          id: string
          message: string
          role: string
          sentiment: string | null
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          id?: string
          message: string
          role: string
          sentiment?: string | null
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          id?: string
          message?: string
          role?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_alerts: {
        Row: {
          alert_type: string
          created_at: string
          date_end: string
          date_start: string
          description: string | null
          id: string
          is_dismissed: boolean
          recommended_action: string | null
          room_id: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          date_end: string
          date_start: string
          description?: string | null
          id?: string
          is_dismissed?: boolean
          recommended_action?: string | null
          room_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          date_end?: string
          date_start?: string
          description?: string | null
          id?: string
          is_dismissed?: boolean
          recommended_action?: string | null
          room_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_alerts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt_text: string
          created_at: string | null
          id: string
          image_url: string
          size: string
          sort_order: number
        }
        Insert: {
          alt_text?: string
          created_at?: string | null
          id?: string
          image_url: string
          size?: string
          sort_order?: number
        }
        Update: {
          alt_text?: string
          created_at?: string | null
          id?: string
          image_url?: string
          size?: string
          sort_order?: number
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          vip: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          vip?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          vip?: boolean
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: string
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount_ghs: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          provider: string
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount_ghs: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Update: {
          amount_ghs?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          room_restrictions: string[] | null
          start_date: string | null
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          room_restrictions?: string[] | null
          start_date?: string | null
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          room_restrictions?: string[] | null
          start_date?: string | null
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      revenue_forecasts: {
        Row: {
          confidence_level: number | null
          created_at: string
          expected_occupancy: number
          forecast_date: string
          id: string
          model_version: string | null
          predicted_revenue: number | null
          recommended_price: number | null
          room_id: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          expected_occupancy?: number
          forecast_date: string
          id?: string
          model_version?: string | null
          predicted_revenue?: number | null
          recommended_price?: number | null
          room_id?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          expected_occupancy?: number
          forecast_date?: string
          id?: string
          model_version?: string | null
          predicted_revenue?: number | null
          recommended_price?: number | null
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_streams: {
        Row: {
          amount_ghs: number
          created_at: string
          description: string | null
          id: string
          record_date: string
          stream_type: string
        }
        Insert: {
          amount_ghs?: number
          created_at?: string
          description?: string | null
          id?: string
          record_date: string
          stream_type: string
        }
        Update: {
          amount_ghs?: number
          created_at?: string
          description?: string | null
          id?: string
          record_date?: string
          stream_type?: string
        }
        Relationships: []
      }
      room_inventory: {
        Row: {
          booked_count: number
          closure_reason: string | null
          date: string
          id: string
          is_closed: boolean
          min_stay: number
          rate_override: number | null
          room_id: string
          total_count: number
        }
        Insert: {
          booked_count?: number
          closure_reason?: string | null
          date: string
          id?: string
          is_closed?: boolean
          min_stay?: number
          rate_override?: number | null
          room_id: string
          total_count?: number
        }
        Update: {
          booked_count?: number
          closure_reason?: string | null
          date?: string
          id?: string
          is_closed?: boolean
          min_stay?: number
          rate_override?: number | null
          room_id?: string
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          base_price_ghs: number
          bed_type: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          max_adults: number
          max_children: number
          name: string
          room_numbers: string[]
          size_sqm: number | null
          slug: string
          sort_order: number | null
          total_units: number
        }
        Insert: {
          amenities?: string[] | null
          base_price_ghs: number
          bed_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          max_adults?: number
          max_children?: number
          name: string
          room_numbers?: string[]
          size_sqm?: number | null
          slug: string
          sort_order?: number | null
          total_units?: number
        }
        Update: {
          amenities?: string[] | null
          base_price_ghs?: number
          bed_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          max_adults?: number
          max_children?: number
          name?: string
          room_numbers?: string[]
          size_sqm?: number | null
          slug?: string
          sort_order?: number | null
          total_units?: number
        }
        Relationships: []
      }
      seasonal_pricing: {
        Row: {
          end_date: string
          id: string
          is_active: boolean
          name: string
          rate_multiplier: number | null
          rate_override: number | null
          room_id: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          rate_multiplier?: number | null
          rate_override?: number | null
          room_id: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          rate_multiplier?: number | null
          rate_override?: number | null
          room_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_pricing_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          guest_id: string | null
          id: string
          issue: string
          reference_id: string
          room_number: string | null
          status: string
          urgency: string
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          id?: string
          issue: string
          reference_id: string
          room_number?: string | null
          status?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          id?: string
          issue?: string
          reference_id?: string
          room_number?: string | null
          status?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          booking_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          source: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          source: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      room_availability: {
        Row: {
          booked_count: number | null
          date: string | null
          is_closed: boolean | null
          min_stay: number | null
          room_id: string | null
          total_count: number | null
        }
        Insert: {
          booked_count?: number | null
          date?: string | null
          is_closed?: boolean | null
          min_stay?: number | null
          room_id?: string | null
          total_count?: number | null
        }
        Update: {
          booked_count?: number | null
          date?: string | null
          is_closed?: boolean | null
          min_stay?: number | null
          room_id?: string | null
          total_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_booking_ref: { Args: never; Returns: string }
      get_my_admin_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "revenue_manager" | "front_desk" | "finance"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      payment_status: "pending" | "partial" | "paid" | "refunded" | "failed"
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
      app_role: ["admin", "revenue_manager", "front_desk", "finance"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      payment_status: ["pending", "partial", "paid", "refunded", "failed"],
    },
  },
} as const
