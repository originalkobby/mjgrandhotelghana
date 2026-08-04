import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MJ Grand Hotel — Convex schema.
 * Ported from Supabase. Every table access must be gated in the mutation/query
 * layer using ctx.auth + hasRole() (see convex/lib/auth.ts).
 */
export default defineSchema({
  // ─── Auth-adjacent ────────────────────────────────────────────────────────
  profiles: defineTable({
    // Clerk user id (string). Do NOT use Convex _id here.
    clerkUserId: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_clerk", ["clerkUserId"]),

  userRoles: defineTable({
    clerkUserId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("revenue_manager"),
      v.literal("front_desk"),
      v.literal("finance"),
    ),
  })
    .index("by_user", ["clerkUserId"])
    .index("by_user_role", ["clerkUserId", "role"]),

  // ─── Core hotel data ──────────────────────────────────────────────────────
  rooms: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    basePriceGhs: v.number(),
    capacity: v.number(),
    bedType: v.optional(v.string()),
    sizeSqm: v.optional(v.number()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    totalUnits: v.number(),
    // roomNumbers is PRIVATE (admin only) — enforce in query layer.
    roomNumbers: v.optional(v.array(v.string())),
    sortOrder: v.number(),
    active: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_sort", ["sortOrder"]),

  roomInventory: defineTable({
    roomId: v.id("rooms"),
    date: v.string(), // ISO YYYY-MM-DD
    totalCount: v.number(),
    bookedCount: v.number(),
    rateOverrideGhs: v.optional(v.number()),
    minStay: v.optional(v.number()),
    closed: v.boolean(),
  })
    .index("by_room_date", ["roomId", "date"])
    .index("by_date", ["date"]),

  bookings: defineTable({
    bookingRef: v.string(), // e.g. MJ-XXXXXXXX
    otaRef: v.optional(v.string()),
    source: v.string(), // direct | booking.com | expedia | ai | walk-in
    guestId: v.id("guests"),
    roomId: v.id("rooms"),
    checkIn: v.string(),
    checkOut: v.string(),
    nights: v.number(),
    adults: v.number(),
    children: v.number(),
    totalGhs: v.number(),
    subtotalGhs: v.number(),
    taxGhs: v.number(),
    discountGhs: v.number(),
    promoCode: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("checked_in"),
      v.literal("checked_out"),
      v.literal("cancelled"),
      v.literal("no_show"),
    ),
    paymentStatus: v.union(
      v.literal("unpaid"),
      v.literal("partial"),
      v.literal("paid"),
      v.literal("refunded"),
    ),
    paymentMethod: v.optional(v.string()),
    paymentRef: v.optional(v.string()),
    notes: v.optional(v.string()),
    specialRequests: v.optional(v.string()),
    roomNumberAssigned: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    cancelledReason: v.optional(v.string()),
    checkedInAt: v.optional(v.number()),
    checkedOutAt: v.optional(v.number()),
  })
    .index("by_ref", ["bookingRef"])
    .index("by_ota_ref", ["otaRef"])
    .index("by_guest", ["guestId"])
    .index("by_room", ["roomId"])
    .index("by_status", ["status"])
    .index("by_checkin", ["checkIn"])
    .index("by_checkout", ["checkOut"]),

  guests: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.optional(v.string()),
    idType: v.optional(v.string()),
    idNumber: v.optional(v.string()),
    vip: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  addOns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    priceGhs: v.number(),
    perNight: v.boolean(),
    active: v.boolean(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  bookingAddOns: defineTable({
    bookingId: v.id("bookings"),
    addOnId: v.id("addOns"),
    quantity: v.number(),
    priceGhs: v.number(),
  }).index("by_booking", ["bookingId"]),

  // ─── Pricing / promotions ────────────────────────────────────────────────
  promotions: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(v.literal("percent"), v.literal("fixed")),
    discountValue: v.number(),
    minNights: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    usedCount: v.number(),
    validFrom: v.string(),
    validTo: v.string(),
    active: v.boolean(),
    publicVisible: v.boolean(),
  }).index("by_code", ["code"]),

  seasonalPricing: defineTable({
    roomId: v.id("rooms"),
    startDate: v.string(),
    endDate: v.string(),
    multiplier: v.number(),
    label: v.optional(v.string()),
  }).index("by_room", ["roomId"]),

  cancellationPolicies: defineTable({
    name: v.string(),
    description: v.string(),
    hoursBefore: v.number(),
    refundPercent: v.number(),
    active: v.boolean(),
  }),

  // ─── Ops / audit ─────────────────────────────────────────────────────────
  bookingAuditLog: defineTable({
    bookingId: v.id("bookings"),
    action: v.string(),
    actorClerkId: v.optional(v.string()),
    actorLabel: v.optional(v.string()),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
  }).index("by_booking", ["bookingId"]),

  paymentLogs: defineTable({
    bookingId: v.optional(v.id("bookings")),
    provider: v.string(),
    reference: v.string(),
    amountGhs: v.number(),
    status: v.string(),
    rawPayload: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_reference", ["reference"]),

  webhookLogs: defineTable({
    source: v.string(),
    event: v.string(),
    reference: v.optional(v.string()),
    signatureValid: v.boolean(),
    payload: v.any(),
    processed: v.boolean(),
    errorMessage: v.optional(v.string()),
  }).index("by_source_ref", ["source", "reference"]),

  demandAlerts: defineTable({
    date: v.string(),
    roomId: v.optional(v.id("rooms")),
    alertType: v.string(),
    severity: v.string(),
    message: v.string(),
    occupancyPct: v.optional(v.number()),
    suggestedActionGhs: v.optional(v.number()),
    acknowledged: v.boolean(),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedAt: v.optional(v.number()),
  }).index("by_date", ["date"]),

  revenueForecasts: defineTable({
    date: v.string(),
    roomId: v.optional(v.id("rooms")),
    forecastGhs: v.number(),
    forecastLowerGhs: v.number(),
    forecastUpperGhs: v.number(),
    actualGhs: v.optional(v.number()),
    model: v.string(),
    generatedAt: v.number(),
  }).index("by_date", ["date"]),

  revenueStreams: defineTable({
    date: v.string(),
    stream: v.string(), // rooms | fnb | events | other
    amountGhs: v.number(),
    notes: v.optional(v.string()),
  }).index("by_date_stream", ["date", "stream"]),

  // ─── Content ─────────────────────────────────────────────────────────────
  galleryImages: defineTable({
    url: v.string(),
    caption: v.optional(v.string()),
    category: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
  }).index("by_category_sort", ["category", "sortOrder"]),

  menuItems: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    priceGhs: v.number(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    available: v.boolean(),
    sortOrder: v.number(),
  }).index("by_category_sort", ["category", "sortOrder"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    handled: v.boolean(),
  }),

  supportTickets: defineTable({
    conversationId: v.optional(v.id("conversations")),
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
    ),
    priority: v.string(),
  }).index("by_status", ["status"]),

  conversations: defineTable({
    sessionId: v.string(),
    guestName: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    channel: v.string(), // web | whatsapp | in-room
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        at: v.number(),
      }),
    ),
    closed: v.boolean(),
  }).index("by_session", ["sessionId"]),

  // ─── Rate limiting (replaces Supabase rate limiter) ──────────────────────
  rateLimits: defineTable({
    key: v.string(), // e.g. "booking:<ip>" or "booking:<email>"
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),
});
