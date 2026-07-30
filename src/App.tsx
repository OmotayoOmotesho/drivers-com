import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RoleSelect from "./pages/onboarding/RoleSelect.tsx";
import CustomerDashboard from "./pages/customer/Dashboard.tsx";
import DriverDashboard from "./pages/driver/Dashboard.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import { Authenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";

function RoleRouter() {
  const user = useQuery(api.users.getCurrentUser, {});
  if (user === undefined) return <div className="min-h-screen flex items-center justify-center"><Spinner className="size-8" /></div>;
  if (!user?.role) return <Navigate to="/onboarding/role" replace />;
  if (user.role === "platform_admin") return <Navigate to="/admin" replace />;
  if (user.role === "driver") return <Navigate to="/driver" replace />;
  if (user.role === "customer") return <Navigate to="/customer" replace />;
  if (user.role === "corporate_admin") return <Navigate to="/customer" replace />;
  return <Navigate to="/onboarding/role" replace />;
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding/role" element={<Authenticated><RoleSelect /></Authenticated>} />
          <Route path="/app" element={<Authenticated><RoleRouter /></Authenticated>} />
          <Route element={<AppLayout role="customer" />}>
            <Route path="/customer/*" element={<Authenticated><CustomerDashboard /></Authenticated>} />
          </Route>
          <Route element={<AppLayout role="driver" />}>
            <Route path="/driver/*" element={<Authenticated><DriverDashboard /></Authenticated>} />
          </Route>
          <Route element={<AppLayout role="admin" />}>
            <Route path="/admin/*" element={<Authenticated><AdminDashboard /></Authenticated>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}