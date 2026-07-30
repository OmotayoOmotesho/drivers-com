import { mutation, query } from "./_generated/server.js";
import { v, ConvexError } from "convex/values";
import { requireDriver } from "./lib/rbac.ts";

export const updateDriverLocation = mutation({
  args: { latitude: v.number(), longitude: v.number() },
  handler: async (ctx, args) => {
    const { driver } = await requireDriver(ctx);
    const now = new Date().toISOString();
    await ctx.db.patch(driver._id, { currentLatitude: args.latitude, currentLongitude: args.longitude, lastLocationAt: now, updatedAt: now });
    const TRACKING = ["driver_en_route","driver_arrived","in_progress"] as const;
    for (const status of TRACKING) {
      const booking = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", status)).filter((q) => q.eq(q.field("driverId"), driver._id)).first();
      if (booking) {
        const existing = booking.tripPath ?? [];
        const path = existing.length >= 500
          ? [...existing.slice(-499), { lat: args.latitude, lng: args.longitude, at: now }]
          : [...existing, { lat: args.latitude, lng: args.longitude, at: now }];
        await ctx.db.patch(booking._id, { tripPath: path, updatedAt: now });
        break;
      }
    }
  },
});

export const getBookingWithDriver = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args): Promise<{
    booking: { _id: string; status: string; pickupAddress: string; pickupLatitude: number; pickupLongitude: number; dropoffAddress: string; dropoffLatitude: number; dropoffLongitude: number; vehicleClass: string; estimatedFareMinor: number; finalFareMinor: number | undefined; tripPath: Array<{ lat: number; lng: number; at: string }>; cancelledBy: string | undefined };
    driver: { name: string | undefined; rating: number; vehicleMake: string; vehicleModel: string; vehicleColor: string; vehiclePlate: string; currentLatitude: number | undefined; currentLongitude: number | undefined; lastLocationAt: string | undefined } | null;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    if (user.role !== "platform_admin") {
      const customer = await ctx.db.query("customers").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
      if (!customer || booking.customerId !== customer._id) return null;
    }
    let driverInfo = null;
    if (booking.driverId) {
      const driver = await ctx.db.get(booking.driverId);
      if (driver) {
        const driverUser = await ctx.db.query("users").withIndex("by_token").filter((q) => q.eq(q.field("_id"), driver.userId)).first();
        driverInfo = { name: driverUser?.name, rating: driver.rating, vehicleMake: driver.vehicleMake, vehicleModel: driver.vehicleModel, vehicleColor: driver.vehicleColor, vehiclePlate: driver.vehiclePlate, currentLatitude: driver.currentLatitude, currentLongitude: driver.currentLongitude, lastLocationAt: driver.lastLocationAt };
      }
    }
    return {
      booking: { _id: booking._id, status: booking.status, pickupAddress: booking.pickupAddress, pickupLatitude: booking.pickupLatitude, pickupLongitude: booking.pickupLongitude, dropoffAddress: booking.dropoffAddress, dropoffLatitude: booking.dropoffLatitude, dropoffLongitude: booking.dropoffLongitude, vehicleClass: booking.vehicleClass, estimatedFareMinor: booking.estimatedFareMinor, finalFareMinor: booking.finalFareMinor, tripPath: booking.tripPath ?? [], cancelledBy: booking.cancelledBy },
      driver: driverInfo,
    };
  },
});