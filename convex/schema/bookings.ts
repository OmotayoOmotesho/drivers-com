import { defineTable } from "convex/server";
import { v } from "convex/values";

export const bookingStatus = v.union(
  v.literal("requested"), v.literal("searching"), v.literal("matched"),
  v.literal("driver_en_route"), v.literal("driver_arrived"), v.literal("in_progress"),
  v.literal("completed"), v.literal("cancelled"), v.literal("disputed"),
);

export const bookingsTable = defineTable({
  customerId: v.id("customers"),
  driverId: v.optional(v.id("drivers")),
  corporateId: v.optional(v.id("corporates")),
  pickupAddress: v.string(),
  pickupLatitude: v.number(),
  pickupLongitude: v.number(),
  dropoffAddress: v.string(),
  dropoffLatitude: v.number(),
  dropoffLongitude: v.number(),
  vehicleClass: v.union(
    v.literal("economy"), v.literal("standard"), v.literal("premium"),
    v.literal("xl"), v.literal("executive"),
  ),
  serviceType: v.union(v.literal("standard"), v.literal("scheduled"), v.literal("corporate")),
  scheduledAt: v.optional(v.string()),
  status: bookingStatus,
  statusHistory: v.array(
    v.object({ status: bookingStatus, at: v.string(), note: v.optional(v.string()) }),
  ),
  version: v.number(),
  estimatedFareMinor: v.number(),
  finalFareMinor: v.optional(v.number()),
  platformFeeMinor: v.optional(v.number()),
  driverEarningsMinor: v.optional(v.number()),
  currency: v.string(),
  paymentIntentId: v.optional(v.string()),
  paymentStatus: v.optional(
    v.union(
      v.literal("pending"), v.literal("authorized"), v.literal("captured"),
      v.literal("refunded"), v.literal("failed"),
    ),
  ),
  tripPath: v.optional(
    v.array(v.object({ lat: v.number(), lng: v.number(), at: v.string() })),
  ),
  customerRating: v.optional(v.number()),
  driverRating: v.optional(v.number()),
  customerRatingNote: v.optional(v.string()),
  driverRatingNote: v.optional(v.string()),
  disputeReason: v.optional(v.string()),
  disputeResolution: v.optional(v.string()),
  disputeResolvedAt: v.optional(v.string()),
  cancelledBy: v.optional(
    v.union(v.literal("customer"), v.literal("driver"), v.literal("system")),
  ),
  cancellationReason: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_customerId", ["customerId"])
  .index("by_status", ["status"])
  .index("by_customer_status", ["customerId", "status"])
  .index("by_createdAt", ["createdAt"]);