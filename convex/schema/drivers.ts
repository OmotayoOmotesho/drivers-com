import { defineTable } from "convex/server";
import { v } from "convex/values";

export const licenceClass = v.union(
  v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"), v.literal("E"),
);

export const vehicleClass = v.union(
  v.literal("economy"), v.literal("standard"), v.literal("premium"),
  v.literal("xl"), v.literal("executive"),
);

export const driversTable = defineTable({
  userId: v.id("users"),
  licenceNumber: v.string(),
  licenceClass: licenceClass,
  licenceExpiry: v.string(),
  licenceDocumentId: v.optional(v.id("_storage")),
  backgroundCheckStatus: v.union(
    v.literal("pending"), v.literal("passed"),
    v.literal("failed"), v.literal("expired"),
  ),
  backgroundCheckConsent: v.optional(v.boolean()),
  backgroundCheckConsentAt: v.optional(v.string()),
  backgroundCheckExpiry: v.optional(v.string()),
  insuranceDocumentId: v.optional(v.id("_storage")),
  insuranceExpiry: v.optional(v.string()),
  vehicleClass: vehicleClass,
  vehicleMake: v.string(),
  vehicleModel: v.string(),
  vehicleYear: v.number(),
  vehiclePlate: v.string(),
  vehicleColor: v.string(),
  vehicleCapacity: v.number(),
  vehicleDocumentId: v.optional(v.id("_storage")),
  verificationStatus: v.union(
    v.literal("pending"), v.literal("under_review"),
    v.literal("approved"), v.literal("rejected"), v.literal("suspended"),
  ),
  verificationNotes: v.optional(v.string()),
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.string()),
  isOnline: v.boolean(),
  currentLatitude: v.optional(v.number()),
  currentLongitude: v.optional(v.number()),
  lastLocationAt: v.optional(v.string()),
  rating: v.number(),
  ratingCount: v.number(),
  completedTrips: v.number(),
  cancelledTrips: v.number(),
  riskFlags: v.array(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_userId", ["userId"])
  .index("by_verificationStatus", ["verificationStatus"])
  .index("by_isOnline", ["isOnline"])
  .index("by_vehicleClass", ["vehicleClass"]);