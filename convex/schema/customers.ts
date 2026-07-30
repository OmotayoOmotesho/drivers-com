import { defineTable } from "convex/server";
import { v } from "convex/values";

export const customersTable = defineTable({
  userId: v.id("users"),
  stripeCustomerId: v.optional(v.string()),
  defaultPaymentMethodId: v.optional(v.string()),
  savedAddresses: v.array(
    v.object({
      label: v.string(),
      address: v.string(),
      latitude: v.number(),
      longitude: v.number(),
    }),
  ),
  rating: v.number(),
  ratingCount: v.number(),
  completedTrips: v.number(),
  createdAt: v.string(),
})
  .index("by_userId", ["userId"])
  .index("by_stripeCustomerId", ["stripeCustomerId"]);