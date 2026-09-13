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
    PostgrestVersion: "14.5"
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
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          usd_to_ghs: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          usd_to_ghs?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          usd_to_ghs?: number
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
          group_ref: string | null
          group_size: number | null
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
          group_ref?: string | null
          group_size?: number | null
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
          group_ref?: string | null
          group_size?: number | null
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
      cod_remittances: {
        Row: {
          amount_due_ghs: number
          amount_remitted_ghs: number
          cash_collected_ghs: number
          collected_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          delivery_id: string
          food_order_id: string | null
          id: string
          note: string | null
          outstanding_ghs: number
          rider_id: string | null
          updated_at: string
        }
        Insert: {
          amount_due_ghs?: number
          amount_remitted_ghs?: number
          cash_collected_ghs?: number
          collected_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivery_id: string
          food_order_id?: string | null
          id?: string
          note?: string | null
          outstanding_ghs?: number
          rider_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_due_ghs?: number
          amount_remitted_ghs?: number
          cash_collected_ghs?: number
          collected_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivery_id?: string
          food_order_id?: string | null
          id?: string
          note?: string | null
          outstanding_ghs?: number
          rider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cod_remittances_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: true
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cod_remittances_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cod_remittances_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
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
      deliveries: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          delivered_at: string | null
          dest_address: string
          dest_landmark: string | null
          dest_lat: number
          dest_lng: number
          dispatch_attempts: number
          dispatch_state: Database["public"]["Enums"]["dispatch_state"]
          distance_km: number
          eta_max_minutes: number
          eta_min_minutes: number
          fee_breakdown: Json
          fee_ghs: number
          fee_overridden_by: string | null
          food_order_id: string
          id: string
          last_customer_email_status:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          on_the_way_at: string | null
          origin_lat: number
          origin_lng: number
          picked_up_at: string | null
          requires_review: boolean
          review_decision: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rider_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_token: string
          travel_minutes: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          delivered_at?: string | null
          dest_address: string
          dest_landmark?: string | null
          dest_lat: number
          dest_lng: number
          dispatch_attempts?: number
          dispatch_state?: Database["public"]["Enums"]["dispatch_state"]
          distance_km?: number
          eta_max_minutes?: number
          eta_min_minutes?: number
          fee_breakdown?: Json
          fee_ghs?: number
          fee_overridden_by?: string | null
          food_order_id: string
          id?: string
          last_customer_email_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          on_the_way_at?: string | null
          origin_lat: number
          origin_lng: number
          picked_up_at?: string | null
          requires_review?: boolean
          review_decision?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_token?: string
          travel_minutes?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          delivered_at?: string | null
          dest_address?: string
          dest_landmark?: string | null
          dest_lat?: number
          dest_lng?: number
          dispatch_attempts?: number
          dispatch_state?: Database["public"]["Enums"]["dispatch_state"]
          distance_km?: number
          eta_max_minutes?: number
          eta_min_minutes?: number
          fee_breakdown?: Json
          fee_ghs?: number
          fee_overridden_by?: string | null
          food_order_id?: string
          id?: string
          last_customer_email_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          on_the_way_at?: string | null
          origin_lat?: number
          origin_lng?: number
          picked_up_at?: string | null
          requires_review?: boolean
          review_decision?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_token?: string
          travel_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: true
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      delivery_offers: {
        Row: {
          attempt: number
          created_at: string
          decline_reason: string | null
          delivery_id: string
          distance_km: number
          estimated_earning_ghs: number
          expires_at: string
          id: string
          offered_at: string
          responded_at: string | null
          rider_id: string
          status: Database["public"]["Enums"]["delivery_offer_status"]
          updated_at: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          decline_reason?: string | null
          delivery_id: string
          distance_km?: number
          estimated_earning_ghs?: number
          expires_at: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          rider_id: string
          status?: Database["public"]["Enums"]["delivery_offer_status"]
          updated_at?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          decline_reason?: string | null
          delivery_id?: string
          distance_km?: number
          estimated_earning_ghs?: number
          expires_at?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          rider_id?: string
          status?: Database["public"]["Enums"]["delivery_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_offers_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_offers_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_riders: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          last_active_at: string | null
          last_lat: number | null
          last_lng: number | null
          last_location_at: string | null
          notes: string | null
          phone: string
          rider_code: string
          status: Database["public"]["Enums"]["rider_status"]
          updated_at: string
          user_id: string | null
          vehicle_reference: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          last_active_at?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_location_at?: string | null
          notes?: string | null
          phone: string
          rider_code: string
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_reference?: string | null
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_active_at?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_location_at?: string | null
          notes?: string | null
          phone?: string
          rider_code?: string
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_reference?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      delivery_settings: {
        Row: {
          auto_assign_riders: boolean
          base_fee_ghs: number
          created_at: string
          customer_tracking_enabled: boolean
          default_prep_minutes: number
          delivery_emails_enabled: boolean
          delivery_enabled: boolean
          discount_percent: number
          eta_buffer_minutes: number
          id: string
          manual_review_km: number
          max_delivery_km: number
          max_dispatch_attempts: number
          max_fee_ghs: number
          min_fee_ghs: number
          offer_timeout_seconds: number
          origin_address: string
          origin_lat: number
          origin_lng: number
          origin_name: string
          peak_end_hour: number
          peak_start_hour: number
          peak_uplift_percent: number
          price_per_km_ghs: number
          reference_rate_ghs: number
          rider_ping_seconds: number
          service_area_label: string
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_assign_riders?: boolean
          base_fee_ghs?: number
          created_at?: string
          customer_tracking_enabled?: boolean
          default_prep_minutes?: number
          delivery_emails_enabled?: boolean
          delivery_enabled?: boolean
          discount_percent?: number
          eta_buffer_minutes?: number
          id?: string
          manual_review_km?: number
          max_delivery_km?: number
          max_dispatch_attempts?: number
          max_fee_ghs?: number
          min_fee_ghs?: number
          offer_timeout_seconds?: number
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          origin_name?: string
          peak_end_hour?: number
          peak_start_hour?: number
          peak_uplift_percent?: number
          price_per_km_ghs?: number
          reference_rate_ghs?: number
          rider_ping_seconds?: number
          service_area_label?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_assign_riders?: boolean
          base_fee_ghs?: number
          created_at?: string
          customer_tracking_enabled?: boolean
          default_prep_minutes?: number
          delivery_emails_enabled?: boolean
          delivery_enabled?: boolean
          discount_percent?: number
          eta_buffer_minutes?: number
          id?: string
          manual_review_km?: number
          max_delivery_km?: number
          max_dispatch_attempts?: number
          max_fee_ghs?: number
          min_fee_ghs?: number
          offer_timeout_seconds?: number
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          origin_name?: string
          peak_end_hour?: number
          peak_start_hour?: number
          peak_uplift_percent?: number
          price_per_km_ghs?: number
          reference_rate_ghs?: number
          rider_ping_seconds?: number
          service_area_label?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      delivery_status_history: {
        Row: {
          actor_role: string | null
          changed_by: string | null
          created_at: string
          delivery_id: string
          id: string
          new_status: Database["public"]["Enums"]["delivery_status"]
          note: string | null
          previous_status: Database["public"]["Enums"]["delivery_status"] | null
        }
        Insert: {
          actor_role?: string | null
          changed_by?: string | null
          created_at?: string
          delivery_id: string
          id?: string
          new_status: Database["public"]["Enums"]["delivery_status"]
          note?: string | null
          previous_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
        }
        Update: {
          actor_role?: string | null
          changed_by?: string | null
          created_at?: string
          delivery_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["delivery_status"]
          note?: string | null
          previous_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          fee_ghs: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_ghs?: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_ghs?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      food_customers: {
        Row: {
          created_at: string
          device_id: string
          email: string
          first_seen_at: string
          full_name: string
          id: string
          last_seen_at: string
          phone: string
          updated_at: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          device_id: string
          email: string
          first_seen_at?: string
          full_name: string
          id?: string
          last_seen_at?: string
          phone: string
          updated_at?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          device_id?: string
          email?: string
          first_seen_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string
          phone?: string
          updated_at?: string
          visit_count?: number
        }
        Relationships: []
      }
      food_order_items: {
        Row: {
          created_at: string
          food_order_id: string
          id: string
          line_total_ghs: number
          menu_item_id: string | null
          name: string
          price_ghs: number
          quantity: number
        }
        Insert: {
          created_at?: string
          food_order_id: string
          id?: string
          line_total_ghs: number
          menu_item_id?: string | null
          name: string
          price_ghs: number
          quantity?: number
        }
        Update: {
          created_at?: string
          food_order_id?: string
          id?: string
          line_total_ghs?: number
          menu_item_id?: string | null
          name?: string
          price_ghs?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_order_items_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          cancelled_email_sent_at: string | null
          confirmation_email_sent_at: string | null
          created_at: string
          delivered_email_sent_at: string | null
          delivery_address: string | null
          delivery_fee_ghs: number
          delivery_landmark: string | null
          delivery_zone_id: string | null
          dispatch_email_sent_at: string | null
          email: string | null
          guest_name: string
          id: string
          notes: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          paid_at: string | null
          payment_method:
            | Database["public"]["Enums"]["delivery_payment_method"]
            | null
          payment_status: Database["public"]["Enums"]["food_payment_status"]
          paystack_reference: string | null
          phone: string | null
          ready_email_sent_at: string | null
          reference_code: string
          room_number: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_ghs: number
          total_ghs: number
          updated_at: string
        }
        Insert: {
          cancelled_email_sent_at?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          delivered_email_sent_at?: string | null
          delivery_address?: string | null
          delivery_fee_ghs?: number
          delivery_landmark?: string | null
          delivery_zone_id?: string | null
          dispatch_email_sent_at?: string | null
          email?: string | null
          guest_name: string
          id?: string
          notes?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["delivery_payment_method"]
            | null
          payment_status?: Database["public"]["Enums"]["food_payment_status"]
          paystack_reference?: string | null
          phone?: string | null
          ready_email_sent_at?: string | null
          reference_code: string
          room_number?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_ghs?: number
          total_ghs?: number
          updated_at?: string
        }
        Update: {
          cancelled_email_sent_at?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          delivered_email_sent_at?: string | null
          delivery_address?: string | null
          delivery_fee_ghs?: number
          delivery_landmark?: string | null
          delivery_zone_id?: string | null
          dispatch_email_sent_at?: string | null
          email?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_method?:
            | Database["public"]["Enums"]["delivery_payment_method"]
            | null
          payment_status?: Database["public"]["Enums"]["food_payment_status"]
          paystack_reference?: string | null
          phone?: string | null
          ready_email_sent_at?: string | null
          reference_code?: string
          room_number?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_ghs?: number
          total_ghs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
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
      rider_compensation_rules: {
        Row: {
          base_ghs: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          max_earning_ghs: number
          min_earning_ghs: number
          model: Database["public"]["Enums"]["rider_comp_model"]
          note: string | null
          peak_bonus_ghs: number
          peak_end_hour: number
          peak_start_hour: number
          per_km_ghs: number
          percent_of_fee: number
          updated_at: string
        }
        Insert: {
          base_ghs?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_earning_ghs?: number
          min_earning_ghs?: number
          model?: Database["public"]["Enums"]["rider_comp_model"]
          note?: string | null
          peak_bonus_ghs?: number
          peak_end_hour?: number
          peak_start_hour?: number
          per_km_ghs?: number
          percent_of_fee?: number
          updated_at?: string
        }
        Update: {
          base_ghs?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_earning_ghs?: number
          min_earning_ghs?: number
          model?: Database["public"]["Enums"]["rider_comp_model"]
          note?: string | null
          peak_bonus_ghs?: number
          peak_end_hour?: number
          peak_start_hour?: number
          per_km_ghs?: number
          percent_of_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      rider_earning_adjustments: {
        Row: {
          created_at: string
          created_by: string | null
          delta_ghs: number
          earning_id: string
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta_ghs: number
          earning_id: string
          id?: string
          reason: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta_ghs?: number
          earning_id?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_earning_adjustments_earning_id_fkey"
            columns: ["earning_id"]
            isOneToOne: false
            referencedRelation: "rider_earnings"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_earnings: {
        Row: {
          adjustment_total_ghs: number
          approved_at: string | null
          approved_by: string | null
          base_earning_ghs: number
          created_at: string
          customer_fee_ghs: number
          delivered_at: string | null
          delivery_id: string
          distance_km: number
          earning_ghs: number
          food_order_id: string | null
          id: string
          paid_at: string | null
          payout_id: string | null
          rider_id: string
          rule_id: string | null
          rule_snapshot: Json
          status: Database["public"]["Enums"]["rider_earning_status"]
          updated_at: string
        }
        Insert: {
          adjustment_total_ghs?: number
          approved_at?: string | null
          approved_by?: string | null
          base_earning_ghs?: number
          created_at?: string
          customer_fee_ghs?: number
          delivered_at?: string | null
          delivery_id: string
          distance_km?: number
          earning_ghs?: number
          food_order_id?: string | null
          id?: string
          paid_at?: string | null
          payout_id?: string | null
          rider_id: string
          rule_id?: string | null
          rule_snapshot?: Json
          status?: Database["public"]["Enums"]["rider_earning_status"]
          updated_at?: string
        }
        Update: {
          adjustment_total_ghs?: number
          approved_at?: string | null
          approved_by?: string | null
          base_earning_ghs?: number
          created_at?: string
          customer_fee_ghs?: number
          delivered_at?: string | null
          delivery_id?: string
          distance_km?: number
          earning_ghs?: number
          food_order_id?: string | null
          id?: string
          paid_at?: string | null
          payout_id?: string | null
          rider_id?: string
          rule_id?: string | null
          rule_snapshot?: Json
          status?: Database["public"]["Enums"]["rider_earning_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_earnings_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: true
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_earnings_food_order_id_fkey"
            columns: ["food_order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_earnings_payout_fk"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "rider_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_earnings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_earnings_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rider_compensation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_locations: {
        Row: {
          accuracy_m: number | null
          delivery_id: string | null
          heading: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          rider_id: string
          speed_mps: number | null
        }
        Insert: {
          accuracy_m?: number | null
          delivery_id?: string | null
          heading?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          rider_id: string
          speed_mps?: number | null
        }
        Update: {
          accuracy_m?: number | null
          delivery_id?: string | null
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          rider_id?: string
          speed_mps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_locations_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_payout_items: {
        Row: {
          amount_ghs: number
          created_at: string
          earning_id: string
          id: string
          payout_id: string
        }
        Insert: {
          amount_ghs: number
          created_at?: string
          earning_id: string
          id?: string
          payout_id: string
        }
        Update: {
          amount_ghs?: number
          created_at?: string
          earning_id?: string
          id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_payout_items_earning_id_fkey"
            columns: ["earning_id"]
            isOneToOne: true
            referencedRelation: "rider_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "rider_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_payouts: {
        Row: {
          amount_ghs: number
          created_at: string
          delivery_count: number
          id: string
          method: Database["public"]["Enums"]["rider_payout_method"]
          notes: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string
          processed_by: string | null
          reference: string | null
          rider_id: string
        }
        Insert: {
          amount_ghs: number
          created_at?: string
          delivery_count?: number
          id?: string
          method: Database["public"]["Enums"]["rider_payout_method"]
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string
          processed_by?: string | null
          reference?: string | null
          rider_id: string
        }
        Update: {
          amount_ghs?: number
          created_at?: string
          delivery_count?: number
          id?: string
          method?: Database["public"]["Enums"]["rider_payout_method"]
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string
          processed_by?: string | null
          reference?: string | null
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_payouts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
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
      current_rider_id: { Args: never; Returns: string }
      generate_booking_ref: { Args: never; Returns: string }
      get_my_admin_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_delivery_ops: { Args: { _user_id: string }; Returns: boolean }
      is_delivery_staff: { Args: { _user_id: string }; Returns: boolean }
      rider_has_open_offer: { Args: { _delivery_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "revenue_manager"
        | "front_desk"
        | "finance"
        | "operations_manager"
        | "restaurant_staff"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
        | "checked_in"
      delivery_offer_status:
        | "offered"
        | "accepted"
        | "declined"
        | "expired"
        | "superseded"
      delivery_payment_method: "paystack" | "cash_on_delivery"
      delivery_status:
        | "pending_review"
        | "review_rejected"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "rider_assigned"
        | "rider_accepted"
        | "rider_picked_up"
        | "on_the_way"
        | "delivered"
        | "cancelled"
        | "failed"
      dispatch_state: "idle" | "offering" | "assigned" | "needs_rider"
      food_payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "cash_on_delivery"
        | "refunded"
      order_status:
        | "pending"
        | "confirmed"
        | "ready"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
      order_type: "dine_in" | "room_service" | "takeaway" | "delivery"
      payment_status: "pending" | "partial" | "paid" | "refunded" | "failed"
      rider_comp_model: "fixed" | "per_km" | "percentage" | "hybrid"
      rider_earning_status:
        | "pending"
        | "approved"
        | "payable"
        | "paid"
        | "disputed"
        | "adjusted"
      rider_payout_method: "cash" | "mobile_money" | "bank_transfer"
      rider_status: "available" | "busy" | "offline" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "revenue_manager",
        "front_desk",
        "finance",
        "operations_manager",
        "restaurant_staff",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
        "checked_in",
      ],
      delivery_offer_status: [
        "offered",
        "accepted",
        "declined",
        "expired",
        "superseded",
      ],
      delivery_payment_method: ["paystack", "cash_on_delivery"],
      delivery_status: [
        "pending_review",
        "review_rejected",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "rider_assigned",
        "rider_accepted",
        "rider_picked_up",
        "on_the_way",
        "delivered",
        "cancelled",
        "failed",
      ],
      dispatch_state: ["idle", "offering", "assigned", "needs_rider"],
      food_payment_status: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "cash_on_delivery",
        "refunded",
      ],
      order_status: [
        "pending",
        "confirmed",
        "ready",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      order_type: ["dine_in", "room_service", "takeaway", "delivery"],
      payment_status: ["pending", "partial", "paid", "refunded", "failed"],
      rider_comp_model: ["fixed", "per_km", "percentage", "hybrid"],
      rider_earning_status: [
        "pending",
        "approved",
        "payable",
        "paid",
        "disputed",
        "adjusted",
      ],
      rider_payout_method: ["cash", "mobile_money", "bank_transfer"],
      rider_status: ["available", "busy", "offline", "suspended"],
    },
  },
} as const
