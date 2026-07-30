import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Clock, Car, MapPin, Navigation, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  requested: { label: "Requested", variant: "secondary" }, searching: { label: "Searching", variant: "secondary" },
  matched: { label: "Matched", variant: "default" }, driver_en_route: { label: "En route", variant: "default" },
  driver_arrived: { label: "Arrived", variant: "default" }, in_progress: { label: "In progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" }, cancelled: { label: "Cancelled", variant: "destructive" },
  disputed: { label: "Disputed", variant: "destructive" },
};

export default function CustomerHistory() {
  const { results, status, loadMore } = usePaginatedQuery(api.bookings.listMyBookings, {}, { initialNumItems: 20 });
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6 space-y-6">
      <div className="flex items-center gap-2"><Clock size={22} /><h1 className="text-2xl font-bold">Trip History</h1></div>
      {status === "LoadingFirstPage" ? (
        <div className="space-y-3">{[0,1,2,3,4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : results.length === 0 ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Car /></EmptyMedia><EmptyTitle>No trips yet</EmptyTitle><EmptyDescription>Your completed and past trips will appear here.</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <div className="space-y-3">
          {results.map((booking) => {
            const b = STATUS_BADGE[booking.status] ?? { label: booking.status, variant: "secondary" as const };
            const fareMinor = booking.finalFareMinor ?? booking.estimatedFareMinor;
            return (
              <Card key={booking._id}><CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm"><MapPin size={13} className="text-primary shrink-0" /><span className="truncate font-medium">{booking.pickupAddress}</span></div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Navigation size={13} className="text-destructive shrink-0" /><span className="truncate">{booking.dropoffAddress}</span></div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-1">
                      <span>{format(new Date(booking.createdAt), "d MMM yyyy, h:mm a")}</span><span>·</span><span className="capitalize">{booking.vehicleClass}</span>
                      {booking.customerRating && (<><span>·</span><span className="flex items-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" />{booking.customerRating}</span></>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={b.variant} className="text-xs">{b.label}</Badge>
                    <span className="text-sm font-semibold">${(fareMinor / 100).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
          {status === "CanLoadMore" && <Button variant="ghost" className="w-full" onClick={() => loadMore(20)}>Load more</Button>}
          {status === "LoadingMore" && <Skeleton className="h-10 w-full" />}
        </div>
      )}
    </div>
  );
}