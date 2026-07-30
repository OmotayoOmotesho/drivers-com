# Drivers.com — Production-Grade Ride-Hailing Marketplace

Full-stack ride-hailing marketplace built with Convex, React 19, Vite, TypeScript, Tailwind CSS 4, Hercules Auth.

## Milestones
- [x] Milestone 1 — Core Schema, Auth & RBAC
- [x] Milestone 2 — Driver Onboarding & KYC
- [x] Milestone 3 — Customer App & Booking Flow  
- [x] Milestone 4 — Driver App & Dispatch Engine
- [x] Milestone 5 — Real-Time Location & Trip Tracking
- [ ] Milestone 6 — Payments & Financial Ledger
- [ ] Milestone 7 — Corporate Accounts & Billing
- [ ] Milestone 8 — Notifications
- [ ] Milestone 9 — Admin Operations Dashboard

## Tech Stack
- **Frontend**: React 19 + Vite, TypeScript, Tailwind CSS 4, shadcn UI, React Router v7, Motion
- **Backend**: Convex (reactive document DB + serverless functions)
- **Auth**: Hercules Auth (OIDC)
- **Maps**: React-Leaflet + OpenStreetMap
- **Forms**: react-hook-form + zod

## Architecture Highlights
- Booking state machine: `requested → matched → driver_en_route → driver_arrived → in_progress → completed`
- OCC (Optimistic Concurrency Control) on job acceptance to prevent double-booking
- 80/20 fare split: drivers earn 80%, platform takes 20%
- Live GPS broadcast throttled to 1 write/5s via `watchPosition`
- TripPath capped at 500 waypoints to stay within 1MB document limit
- Full RBAC: customer / driver / corporate_admin / platform_admin

## Setup
1. `pnpm install`
2. Set required secrets in the Hercules Secrets tab (HERCULES_OIDC_AUTHORITY, HERCULES_OIDC_CLIENT_ID, VITE_CONVEX_URL, etc.)
3. `pnpm dev`
