import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { CreditCard, Car, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function DriverEarnings() {
  const stats = useQuery(api.dispatch.getMyDriverStats, {});
  if (stats === undefined) return <div className="p-6 max-w-4xl mx-auto space-y-4"><Skeleton className="h-10 w-40" /><div className="grid grid-cols-2 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div></div>;
  const totalEarnings = (stats?.totalEarningsMinor ?? 0) / 100;
  const grossFare = totalEarnings / 0.8;
  const summaryCards = [
    { icon: CreditCard, label: "Total earnings", value: `$${totalEarnings.toFixed(2)}`, sub: "Your 80% cut" },
    { icon: TrendingUp, label: "Gross fare", value: `$${grossFare.toFixed(2)}`, sub: "Before platform fee" },
    { icon: Car, label: "Completed trips", value: stats?.completedTrips.toString() ?? "0", sub: "All time" },
    { icon: Star, label: "Driver rating", value: (stats?.rating ?? 5).toFixed(1), sub: `${stats?.ratingCount ?? 0} ratings` },
  ];
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">Earnings</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(({ icon: Icon, label, value, sub }) => (
          <Card key={label}><CardContent className="pt-5 pb-4"><div className="space-y-1"><div className="p-2 rounded-lg bg-primary/10 w-fit mb-2"><Icon size={15} className="text-primary" /></div><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p><p className="text-xs text-muted-foreground/60">{sub}</p></div></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="text-base">Payout Information</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>You earn <span className="font-semibold text-foreground">80%</span> of each fare. Platform takes 20%.</p>
          <p>Stripe payout integration will be available in the Payments milestone.</p>
        </CardContent>
      </Card>
    </div>
  );
}