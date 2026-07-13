import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * PRODUCTION-READY SCHEMA
 * This schema is designed to be lenient during the migration process.
 * It allows both 'string' and 'null' values for optional fields to 
 * prevent deployment errors when existing production data contains nulls.
 */

const nullableString = v.optional(v.union(v.string(), v.null()));
const nullableFloat = v.optional(v.union(v.float64(), v.null()));
const nullableBoolean = v.optional(v.union(v.boolean(), v.null()));
const nullableAny = v.optional(v.any());

export default defineSchema({
  guests: defineTable({
    full_name: nullableString,
    email: nullableString,
    phone: nullableString,
    preferences: nullableAny,
    vip: nullableBoolean,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }).index("by_email", ["email"]),

  rooms: defineTable({
    name: nullableString,
    slug: nullableString,
    description: nullableString,
    base_price_ghs: nullableFloat,
    bed_type: nullableString,
    size_sqm: nullableFloat,
    amenities: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    max_adults: nullableFloat,
    max_children: nullableFloat,
    total_units: nullableFloat,
    room_numbers: v.optional(v.array(v.string())),
    is_active: nullableBoolean,
    sort_order: nullableFloat,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }).index("by_slug", ["slug"]),

  bookings: defineTable({
    reference_code: nullableString,
    guest_id: nullableString, 
    room_id: nullableString, 
    check_in: nullableString,
    check_out: nullableString,
    adults: nullableFloat,
    children: nullableFloat,
    status: nullableString, 
    payment_status: nullableString, 
    payment_method: nullableString,
    booking_source: nullableString,
    ota_reference: nullableString,
    room_number: nullableString,
    base_total_ghs: nullableFloat,
    add_ons_total_ghs: nullableFloat,
    discount_ghs: nullableFloat,
    final_total_ghs: nullableFloat,
    promo_code: nullableString,
    special_requests: nullableString,
    arrival_time: nullableString,
    nationality: nullableString,
    actual_check_in: nullableString,
    actual_check_out: nullableString,
    cancellation_policy_id: nullableString,
    created_at: nullableString,
    updated_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }).index("by_reference", ["reference_code"]),

  room_inventory: defineTable({
    room_id: nullableString,
    date: nullableString,
    total_count: nullableFloat,
    booked_count: nullableFloat,
    rate_override: nullableFloat,
    is_closed: nullableBoolean,
    min_stay: nullableFloat,
    closure_reason: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }).index("by_room_date", ["room_id", "date"]),

  add_ons: defineTable({
    name: nullableString,
    description: nullableString,
    price_ghs: nullableFloat,
    category: nullableString,
    icon: nullableString,
    is_active: nullableBoolean,
    sort_order: nullableFloat,
    supabase_id: nullableString,
    id: nullableString,
  }),

  booking_add_ons: defineTable({
    booking_id: nullableString,
    add_on_id: nullableString,
    quantity: nullableFloat,
    unit_price_ghs: nullableFloat,
    total_price_ghs: nullableFloat,
    supabase_id: nullableString,
    id: nullableString,
  }),

  payment_logs: defineTable({
    booking_id: nullableString,
    amount_ghs: nullableFloat,
    currency: nullableString,
    provider: nullableString,
    provider_reference: nullableString,
    status: nullableString,
    metadata: nullableAny,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  promotions: defineTable({
    code: nullableString,
    description: nullableString,
    discount_type: nullableString,
    discount_value: nullableFloat,
    start_date: nullableString,
    end_date: nullableString,
    usage_limit: nullableFloat,
    usage_count: nullableFloat,
    is_active: nullableBoolean,
    room_restrictions: v.optional(v.array(v.string())),
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  cancellation_policies: defineTable({
    name: nullableString,
    description: nullableString,
    deadline_hours: nullableFloat,
    refund_percentage: nullableFloat,
    is_default: nullableBoolean,
    supabase_id: nullableString,
    id: nullableString,
  }),

  booking_audit_log: defineTable({
    booking_id: nullableString,
    old_status: nullableString,
    new_status: nullableString,
    note: nullableString,
    changed_by: nullableString, // This will now accept both string and null
    changed_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  contact_messages: defineTable({
    full_name: nullableString,
    email: nullableString,
    message: nullableString,
    is_read: nullableBoolean,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  conversations: defineTable({
    guest_id: nullableString,
    message: nullableString,
    role: nullableString,
    sentiment: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  support_tickets: defineTable({
    guest_id: nullableString,
    issue: nullableString,
    status: nullableString,
    urgency: nullableString,
    reference_id: nullableString,
    room_number: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  gallery_images: defineTable({
    image_url: nullableString,
    alt_text: nullableString,
    size: nullableString,
    sort_order: nullableFloat,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  menu_items: defineTable({
    name: nullableString,
    description: nullableString,
    price: nullableString,
    category: nullableString,
    is_active: nullableBoolean,
    sort_order: nullableFloat,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  webhook_logs: defineTable({
    event_type: nullableString,
    payload: nullableAny,
    status: nullableString,
    error_message: nullableString,
    source: nullableString,
    booking_id: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  revenue_forecasts: defineTable({
    forecast_date: nullableString,
    room_id: nullableString,
    expected_occupancy: nullableFloat,
    predicted_revenue: nullableFloat,
    recommended_price: nullableFloat,
    confidence_level: nullableFloat,
    model_version: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  demand_alerts: defineTable({
    title: nullableString,
    description: nullableString,
    severity: nullableString,
    alert_type: nullableString,
    date_start: nullableString,
    date_end: nullableString,
    room_id: nullableString,
    recommended_action: nullableString,
    is_dismissed: nullableBoolean,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  revenue_streams: defineTable({
    stream_type: nullableString,
    amount_ghs: nullableFloat,
    record_date: nullableString,
    description: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  seasonal_pricing: defineTable({
    name: nullableString,
    room_id: nullableString,
    start_date: nullableString,
    end_date: nullableString,
    rate_multiplier: nullableFloat,
    rate_override: nullableFloat,
    is_active: nullableBoolean,
    supabase_id: nullableString,
    id: nullableString,
  }),

  profiles: defineTable({
    full_name: nullableString,
    avatar_url: nullableString,
    updated_at: nullableString,
    created_at: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),

  user_roles: defineTable({
    user_id: nullableString,
    role: nullableString,
    supabase_id: nullableString,
    id: nullableString,
  }),
});
