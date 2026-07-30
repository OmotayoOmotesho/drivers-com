import { defineSchema } from "convex/server";
import { usersTable } from "./schema/users.ts";
import { driversTable } from "./schema/drivers.ts";
import { customersTable } from "./schema/customers.ts";
import { bookingsTable } from "./schema/bookings.ts";
import { ledgerTable, corporatesTable, notificationsTable, idempotencyTable } from "./schema/financials.ts";

export default defineSchema({
  users: usersTable,
  drivers: driversTable,
  customers: customersTable,
  bookings: bookingsTable,
  ledger: ledgerTable,
  corporates: corporatesTable,
  notifications: notificationsTable,
  idempotency: idempotencyTable,
});