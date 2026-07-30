import { Routes, Route } from "react-router-dom";
import { BarChart3, Car, Users, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "motion/react";
import AdminBookings from "./_components/Bookings.tsx";
import AdminDrivers from "./_components/Drivers.tsx";
import AdminCustomers from "./_components/Customers.tsx";
import AdminFinancials from "./_components/Financials.tsx";
import AdminCompliance from "./_components/Compliance.tsx";

export default function AdminDashboard() {
  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="drivers" element={<AdminDrivers />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="financials" element={<AdminFinancials />} />
      <Route path="compliance" element={<AdminCompliance />} />
    </Routes>
  );
}

function AdminOverview() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Operations Overview</h1>
        <p className="text-muted-foreground">Platform health and activity summary</p>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Car, label: "Active bookings", value: "—", trend: "+12%" },
          { icon: Users, label: "Online drivers", value: "—", trend: "Live" },
          { icon: CreditCard, label: "Revenue today", value: "$—", trend: "+8%" },
          { icon: ShieldCheck, label: "Pending KYC", value: "—", trend: "Review" },
        ].map(({ icon: Icon, label, value, trend }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card><CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><Icon size={16} className="text-primary" /></div>
                <Badge variant="secondary" className="text-xs">{trend}</Badge>
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 size={16} /> Recent Bookings</CardTitle></CardHeader>
          <CardContent><div className="text-center py-10 text-muted-foreground"><Car size={36} className="mx-auto mb-3 opacity-25" /><p className="text-sm">Booking data will appear after real trips begin.</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle size={16} /> Compliance Alerts</CardTitle></CardHeader>
          <CardContent><div className="text-center py-10 text-muted-foreground"><ShieldCheck size={36} className="mx-auto mb-3 opacity-25" /><p className="text-sm">No alerts. All drivers compliant.</p></div></CardContent></Card>
      </div>
    </div>
  );
}