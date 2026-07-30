import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userRole = v.union(
  v.literal("customer"),
  v.literal("driver"),
  v.literal("corporate_admin"),
  v.literal("platform_admin"),
);

export const usersTable = defineTable({
  tokenIdentifier: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  avatar: v.optional(v.string()),
  role: v.optional(userRole),
  phone: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("pending_verification"),
  ),
  corporateId: v.optional(v.id("corporates")),
  createdAt: v.string(),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_role", ["role"])
  .index("by_email", ["email"]);