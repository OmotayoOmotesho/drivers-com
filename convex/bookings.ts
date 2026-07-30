import { mutation, query } from "./_generated/server.js";
import { v, ConvexError } from "convex/values";
import { requireAnyRole } from "./lib/rbac.ts";
import { paginationOptsValidator } from "convex/server";

const BASE_FARES: Record<string, number> = {
  economy: 1000, standard: 1500, premium: 2800, xl: 2200, executive: 3800,
};

export const estimateFare = query({
  args: { vehicleClass: v.union(v.literal("economy"), v.literal("standard"), v.literal("premium"), v.literal("xl"), v.literal("executive")) },
  handler: async (_ctx, args) => {
    const base = BASE_FARES[args.vehicleClass] ?? 1000;
    return { estimatedFareMinor: base, currency: "USD" };
  },
});

const ACTIVE_STATUSES = ["requested","searching","matched","driver_en_route","driver_arrived","in_progress"] as const;

export const requestBooking = mutation({
  args: {
    pickupAddress: v.string(), pickupLatitude: v.number(), pickupLongitude: v.number(),
    dropoffAddress: v.string(), dropoffLatitude: v.number(), dropoffLongitude: v.number(),
    vehicleClass: v.union(v.literal("economy"), v.literal("standard"), v.literal("premium"), v.literal("xl"), v.literal("executive")),
    estimatedFareMinor: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAnyRole(ctx, ["customer", "corporate_admin"]);
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer) throw new ConvexError({ message: "Customer profile not found", code: "NOT_FOUND" });
    for (const status of ACTIVE_STATUSES) {
      const existing = await ctx.db.query("bookings").withIndex("by_customer_status", (q) => q.eq("customerId", customer._id).eq("status", status)).first();
      if (existing) throw new ConvexError({ message: "You already have an active booking", code: "CONFLICT" });
    }
    const now = new Date().toISOString();
    return await ctx.db.insert("bookings", {
      customerId: customer._id,
      pickupAddress: args.pickupAddress, pickupLatitude: args.pickupLatitude, pickupLongitude: args.pickupLongitude,
      dropoffAddress: args.dropoffAddress, dropoffLatitude: args.dropoffLatitude, dropoffLongitude: args.dropoffLongitude,
      vehicleClass: args.vehicleClass, serviceType: "standard", status: "requested",
      statusHistory: [{ status: "requested", at: now }], version: 1,
      estimatedFareMinor: args.estimatedFareMinor, currency: "USD", createdAt: now, updatedAt: now,
    });
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireAnyRole(ctx, ["customer", "corporate_admin"]);
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer) throw new ConvexError({ message: "Customer profile not found", code: "NOT_FOUND" });
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.customerId !== customer._id) throw new ConvexError({ message: "Not your booking", code: "FORBIDDEN" });
    if (!["requested","searching","matched"].includes(booking.status)) throw new ConvexError({ message: "Booking cannot be cancelled at this stage", code: "BAD_REQUEST" });
    const now = new Date().toISOString();
    await ctx.db.patch(args.bookingId, { status: "cancelled", statusHistory: [...booking.statusHistory, { status: "cancelled" as const, at: now, note: args.reason ?? "Cancelled by customer" }], cancelledBy: "customer", cancellationReason: args.reason, updatedAt: now });
  },
});

export const rateTrip = mutation({
  args: { bookingId: v.id("bookings"), rating: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireAnyRole(ctx, ["customer", "corporate_admin"]);
    if (args.rating < 1 || args.rating > 5) throw new ConvexError({ message: "Rating must be 1-5", code: "BAD_REQUEST" });
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer) throw new ConvexError({ message: "Customer profile not found", code: "NOT_FOUND" });
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.customerId !== customer._id) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.status !== "completed") throw new ConvexError({ message: "Trip must be completed to rate", code: "BAD_REQUEST" });
    if (booking.customerRating !== undefined) throw new ConvexError({ message: "Trip already rated", code: "CONFLICT" });
    await ctx.db.patch(args.bookingId, { customerRating: args.rating, customerRatingNote: args.note, updatedAt: new Date().toISOString() });
  },
});

export const getMyActiveBooking = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer) return null;
    for (const status of ACTIVE_STATUSES) {
      const booking = await ctx.db.query("bookings").withIndex("by_customer_status", (q) => q.eq("customerId", customer._id).eq("status", status)).first();
      if (booking) return booking;
    }
    return null;
  },
});

export const listMyBookings = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return { page: [], isDone: true, continueCursor: "" };
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer) return { page: [], isDone: true, continueCursor: "" };
    return ctx.db.query("bookings").withIndex("by_customerId", (q) => q.eq("customerId", customer._id)).order("desc").paginate(args.paginationOpts);
  },
});

export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    if (user.role === "platform_admin") return booking;
    const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!customer || booking.customerId !== customer._id) return null;
    return booking;
  },
});

export const getMyCustomerProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    return ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
  },
});