import { Outlet, Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";
import Sidebar from "./Sidebar.tsx";

type AppLayoutProps = { role: "customer" | "driver" | "admin" };

export default function AppLayout({ role }: AppLayoutProps) {
  const user = useQuery(api.users.getCurrentUser, {});
  if (user === undefined) return <div className="min-h-screen flex items-center justify-center bg-background"><Spinner className="size-8" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (!user.role) return <Navigate to="/onboarding/role" replace />;
  const allowed =
    (role === "customer" && (user.role === "customer" || user.role === "corporate_admin")) ||
    (role === "driver" && user.role === "driver") ||
    (role === "admin" && user.role === "platform_admin");
  if (!allowed) return <Navigate to="/" replace />;
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} user={user} />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}