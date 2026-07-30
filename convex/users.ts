import { mutation, query } from "./_generated/server.js";
import { v, ConvexError } from "convex/values";
import { requireUser, requireRole } from "./lib/rbac.ts";
import { userRole } from "./schema/users.ts";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const existing = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { name: identity.name ?? existing.name, email: identity.email ?? existing.email, avatar: identity.profileUrl ?? existing.avatar });
      return existing._id;
    }
    return await ctx.db.insert("users", { tokenIdentifier: identity.tokenIdentifier, name: identity.name, email: identity.email, avatar: identity.profileUrl, status: "pending_verification", createdAt: now });
  },
});

export const setRole = mutation({
  args: { role: userRole },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== undefined) throw new ConvexError({ message: "Role already set", code: "CONFLICT" });
    const now = new Date().toISOString();
    await ctx.db.patch(user._id, { role: args.role, status: "active" });
    if (args.role === "customer" || args.role === "corporate_admin") {
      await ctx.db.insert("customers", { userId: user._id, savedAddresses: [], rating: 5, ratingCount: 0, completedTrips: 0, createdAt: now });
    }
    return { userId: user._id, role: args.role };
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique() ?? null;
  },
});

export const updateProfile = mutation({
  args: { name: v.optional(v.string()), phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const patch: Partial<{ name: string; phone: string }> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    await ctx.db.patch(user._id, patch);
  },
});

export const adminUpdateUser = mutation({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("pending_verification"))),
    role: v.optional(userRole),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "platform_admin");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    const patch: { status?: "active" | "suspended" | "pending_verification"; role?: "customer" | "driver" | "corporate_admin" | "platform_admin" } = {};
    if (args.status !== undefined) patch.status = args.status;
    if (args.role !== undefined) patch.role = args.role;
    await ctx.db.patch(args.userId, patch);
  },
});

export const adminListUsers = query({
  args: { role: v.optional(userRole) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const admin = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!admin || admin.role !== "platform_admin") return [];
    if (args.role !== undefined) return await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role)).take(100);
    return await ctx.db.query("users").order("desc").take(100);
  },
});