import { Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";

export default function AdminBookings() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Bookings</h1>
      <Card><CardContent className="pt-6 text-center py-16 text-muted-foreground"><Car size={40} className="mx-auto mb-4 opacity-25" /><p className="font-medium">No bookings yet</p><p className="text-sm mt-1">Bookings will appear here once customers start booking rides.</p></CardContent></Card>
    </div>
  );
}