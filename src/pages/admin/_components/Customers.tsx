import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";

export default function AdminCustomers() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <Card><CardContent className="pt-6 text-center py-16 text-muted-foreground"><Users size={40} className="mx-auto mb-4 opacity-25" /><p className="font-medium">No customers yet</p></CardContent></Card>
    </div>
  );
}