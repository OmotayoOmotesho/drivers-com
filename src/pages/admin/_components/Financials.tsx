import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";

export default function AdminFinancials() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Financials</h1>
      <Card><CardContent className="pt-6 text-center py-16 text-muted-foreground"><CreditCard size={40} className="mx-auto mb-4 opacity-25" /><p className="font-medium">Financial ledger</p><p className="text-sm mt-1">Full ledger, payouts, and invoices in the Payments milestone.</p></CardContent></Card>
    </div>
  );
}