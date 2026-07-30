import { defineTable } from "convex/server";
import { v } from "convex/values";

export const ledgerTable = defineTable({
  bookingId: v.optional(v.id("bookings")),
  userId: v.id("users"),
  type: v.union(
    v.literal("fare_charge"), v.literal("platform_fee"),
    v.literal("driver_payout"), v.literal("refund"),
    v.literal("adjustment"), v.literal("corporate_invoice_item"),
  ),
  amountMinor: v.number(),
  currency: v.string(),
  stripeEventId: v.optional(v.string()),
  description: v.string(),
  createdAt: v.string(),
})
  .index("by_userId", ["userId"])
  .index("by_type", ["type"])
  .index("by_createdAt", ["createdAt"]);

export const corporatesTable = defineTable({
  name: v.string(),
  adminUserId: v.id("users"),
  stripeCustomerId: v.optional(v.string()),
  invoicingEmail: v.string(),
  billingCycle: v.union(v.literal("monthly"), v.literal("weekly")),
  ridePolicy: v.object({
    maxFareMinor: v.optional(v.number()),
    allowedVehicleClasses: v.array(v.string()),
    requireApproval: v.boolean(),
  }),
  status: v.union(v.literal("active"), v.literal("suspended")),
  createdAt: v.string(),
}).index("by_adminUserId", ["adminUserId"]);

export const notificationsTable = defineTable({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  body: v.string(),
  data: v.optional(v.string()),
  read: v.boolean(),
  createdAt: v.string(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_read", ["userId", "read"])
  .index("by_createdAt", ["createdAt"]);

export const idempotencyTable = defineTable({
  key: v.string(),
  result: v.optional(v.string()),
  createdAt: v.string(),
}).index("by_key", ["key"]);