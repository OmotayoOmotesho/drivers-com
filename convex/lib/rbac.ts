import { ConvexError } from "convex/values";
import type { DatabaseReader } from "../_generated/server.d.ts";
import type { Id } from "../_generated/dataModel.d.ts";

const ROLE_LEVELS = {
  customer: 1,
  driver: 2,
  corporate_admin: 3,
  platform_admin: 4,
} as const;

type Role = keyof typeof ROLE_LEVELS;

type Ctx = { db: DatabaseReader; auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> } };

async function getUserByToken(db: DatabaseReader, tokenIdentifier: string) {
  return await db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

async function getDriverByUserId(db: DatabaseReader, userId: Id<"users">) {
  return await db.query("drivers").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
}

async function getCustomerByUserId(db: DatabaseReader, userId: Id<"users">) {
  return await db.query("customers").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
}

export async function requireUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  const user = await getUserByToken(ctx.db, identity.tokenIdentifier);
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  if (user.status === "suspended") throw new ConvexError({ message: "Account suspended", code: "FORBIDDEN" });
  return user;
}

export async function requireRole(ctx: Ctx, minRole: Role) {
  const user = await requireUser(ctx);
  const userLevel = ROLE_LEVELS[user.role as Role] ?? 0;
  if (userLevel < ROLE_LEVELS[minRole]) throw new ConvexError({ message: `Requires ${minRole} or higher`, code: "FORBIDDEN" });
  return user;
}

export async function requireAnyRole(ctx: Ctx, roles: Role[]) {
  const user = await requireUser(ctx);
  if (!roles.includes(user.role as Role)) throw new ConvexError({ message: `Requires one of: ${roles.join(", ")}`, code: "FORBIDDEN" });
  return user;
}

export async function requireDriver(ctx: Ctx) {
  const user = await requireAnyRole(ctx, ["driver"]);
  const driver = await getDriverByUserId(ctx.db, user._id);
  if (!driver) throw new ConvexError({ message: "Driver profile not found", code: "NOT_FOUND" });
  return { user, driver };
}

export async function requireCustomer(ctx: Ctx) {
  const user = await requireAnyRole(ctx, ["customer"]);
  const customer = await getCustomerByUserId(ctx.db, user._id);
  if (!customer) throw new ConvexError({ message: "Customer profile not found", code: "NOT_FOUND" });
  return { user, customer };
}