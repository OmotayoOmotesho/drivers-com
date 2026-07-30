import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";

export default function CustomerPayments() {
  return (
    <div className="p-6 max-w-2xl mx-auto pb-20 md:pb-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CreditCard size={22} /> Payments</h1>
      <Card><CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard size={36} className="mx-auto mb-3 opacity-25" />
            <p className="font-medium">No payment methods</p>
            <p className="text-sm mt-1">Add a card to start booking rides.</p>
          </div>
          <Button className="w-full" onClick={() => toast.info("Stripe payment setup coming in the Payments milestone.")}>Add payment method</Button>
        </CardContent>
      </Card>
    </div>
  );
}