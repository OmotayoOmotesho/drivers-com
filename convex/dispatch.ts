import { mutation, query } from "./_generated/server.js";
import { v, ConvexError } from "convex/values";
import { requireDriver } from "./lib/rbac.ts";
import { paginationOptsValidator } from "convex/server";

export const setOnlineStatus = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    if (args.isOnline && driver.verificationStatus !== "approved") throw new ConvexError({ message: "Only approved drivers can go online", code: "FORBIDDEN" });
    await ctx.db.patch(driver._id, { isOnline: args.isOnline, updatedAt: new Date().toISOString() });
  },
});

export const getAvailableJobs = query({
  args: {},
  handler: async (ctx): Promise<Array<{ bookingId: string; pickupAddress: string; dropoffAddress: string; vehicleClass: string; estimatedFareMinor: number; currency: string; createdAt: string }>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const driver = await ctx.db.query("drivers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!driver || !driver.isOnline || driver.verificationStatus !== "approved") return [];
    const requested = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "requested")).order("asc").take(50);
    return requested.filter((b) => b.vehicleClass === driver.vehicleClass).map((b) => ({ bookingId: b._id, pickupAddress: b.pickupAddress, dropoffAddress: b.dropoffAddress, vehicleClass: b.vehicleClass, estimatedFareMinor: b.estimatedFareMinor, currency: b.currency, createdAt: b.createdAt }));
  },
});

export const acceptJob = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    if (!driver.isOnline) throw new ConvexError({ message: "You must be online to accept jobs", code: "BAD_REQUEST" });
    if (driver.verificationStatus !== "approved") throw new ConvexError({ message: "Not an approved driver", code: "FORBIDDEN" });
    const ACTIVE = ["matched","driver_en_route","driver_arrived","in_progress"] as const;
    for (const status of ACTIVE) {
      const existing = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", status)).filter((q) => q.eq(q.field("driverId"), driver._id)).first();
      if (existing) throw new ConvexError({ message: "You already have an active trip", code: "CONFLICT" });
    }
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.status !== "requested") throw new ConvexError({ message: "Booking is no longer available", code: "CONFLICT" });
    if (booking.vehicleClass !== driver.vehicleClass) throw new ConvexError({ message: "Vehicle class mismatch", code: "BAD_REQUEST" });
    const now = new Date().toISOString();
    await ctx.db.patch(args.bookingId, { status: "matched", driverId: driver._id, version: booking.version + 1, statusHistory: [...booking.statusHistory, { status: "matched" as const, at: now }], updatedAt: now });
    return args.bookingId;
  },
});

const VALID_TRANSITIONS: Record<string, string> = {
  matched: "driver_en_route", driver_en_route: "driver_arrived", driver_arrived: "in_progress", in_progress: "completed",
};

type BookingStatus = "requested"|"searching"|"matched"|"driver_en_route"|"driver_arrived"|"in_progress"|"completed"|"cancelled"|"disputed";

export const advanceTripStatus = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.driverId !== driver._id) throw new ConvexError({ message: "Not your booking", code: "FORBIDDEN" });
    const nextStatus = VALID_TRANSITIONS[booking.status];
    if (!nextStatus) throw new ConvexError({ message: `Cannot advance from status: ${booking.status}`, code: "BAD_REQUEST" });
    const now = new Date().toISOString();
    const patch: Partial<{ status: BookingStatus; statusHistory: Array<{ status: BookingStatus; at: string; note?: string }>; updatedAt: string; finalFareMinor: number; platformFeeMinor: number; driverEarningsMinor: number }> = {
      status: nextStatus as BookingStatus,
      statusHistory: [...booking.statusHistory, { status: nextStatus as BookingStatus, at: now }],
      updatedAt: now,
    };
    if (nextStatus === "completed") {
      const finalFare = booking.estimatedFareMinor;
      const platformFee = Math.round(finalFare * 0.2);
      patch.finalFareMinor = finalFare;
      patch.platformFeeMinor = platformFee;
      patch.driverEarningsMinor = finalFare - platformFee;
      await ctx.db.patch(driver._id, { completedTrips: driver.completedTrips + 1, updatedAt: now });
    }
    await ctx.db.patch(args.bookingId, patch);
    return nextStatus;
  },
});

export const driverCancelTrip = mutation({
  args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.driverId !== driver._id) throw new ConvexError({ message: "Not your booking", code: "FORBIDDEN" });
    if (!["matched","driver_en_route"].includes(booking.status)) throw new ConvexError({ message: "Cannot cancel at this stage", code: "BAD_REQUEST" });
    const now = new Date().toISOString();
    await ctx.db.patch(args.bookingId, { status: "requested", driverId: undefined, version: booking.version + 1, statusHistory: [...booking.statusHistory, { status: "requested" as const, at: now, note: "Re-opened after driver cancel" }], cancelledBy: "driver", cancellationReason: args.reason ?? "Driver cancelled", updatedAt: now });
    await ctx.db.patch(driver._id, { cancelledTrips: driver.cancelledTrips + 1, updatedAt: now });
  },
});

const ACTIVE_TRIP_STATUSES = ["matched","driver_en_route","driver_arrived","in_progress"] as const;

export const getMyActiveTrip = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const driver = await ctx.db.query("drivers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!driver) return null;
    for (const status of ACTIVE_TRIP_STATUSES) {
      const booking = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", status)).filter((q) => q.eq(q.field("driverId"), driver._id)).first();
      if (booking) {
        const customer = await ctx.db.get(booking.customerId);
        const customerUser = customer ? await ctx.db.query("users").withIndex("by_token").filter((q) => q.eq(q.field("_id"), customer.userId)).first() : null;
        return { ...booking, customerName: customerUser?.name ?? "Customer", customerRating: customer?.rating ?? 5 };
      }
    }
    return null;
  },
});

export const listMyDriverTrips = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return { page: [], isDone: true, continueCursor: "" };
    const driver = await ctx.db.query("drivers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!driver) return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "completed")).order("desc").paginate(args.paginationOpts);
    return { ...result, page: result.page.filter((b) => b.driverId === driver._id) };
  },
});

export const getMyDriverStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const driver = await ctx.db.query("drivers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!driver) return null;
    const recent = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "completed")).order("desc").take(200);
    const mine = recent.filter((b) => b.driverId === driver._id);
    const totalEarningsMinor = mine.reduce((sum, b) => sum + (b.driverEarningsMinor ?? 0), 0);
    return { isOnline: driver.isOnline, completedTrips: driver.completedTrips, cancelledTrips: driver.cancelledTrips, rating: driver.rating, ratingCount: driver.ratingCount, totalEarningsMinor, vehicleClass: driver.vehicleClass, verificationStatus: driver.verificationStatus };
  },
});