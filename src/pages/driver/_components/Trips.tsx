import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Car, MapPin, Navigation, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { format, formatDistanceToNow } from "date-fns";

export default function DriverTrips() {
  const { results, status, loadMore } = usePaginatedQuery(api.dispatch.listMyDriverTrips, {}, { initialNumItems: 25 });
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">My Trips</h1>
      {status === "LoadingFirstPage" ? (
        <div className="space-y-3">{[0,1,2,3,4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : results.length === 0 ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Car /></EmptyMedia><EmptyTitle>No completed trips yet</EmptyTitle><EmptyDescription>Go online and accept your first job.</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <div className="space-y-3">
          {results.map((trip) => {
            const earnings = trip.driverEarningsMinor ?? Math.round(trip.estimatedFareMinor * 0.8);
            return (
              <Card key={trip._id}><CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm"><MapPin size={13} className="text-primary shrink-0" /><span className="truncate font-medium">{trip.pickupAddress}</span></div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Navigation size={13} className="text-destructive shrink-0" /><span className="truncate">{trip.dropoffAddress}</span></div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-1">
                      <span>{format(new Date(trip.createdAt), "d MMM yyyy, h:mm a")}</span><span>·</span><span className="capitalize">{trip.vehicleClass}</span>
                      {trip.driverRating && (<><span>·</span><span className="flex items-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" />{trip.driverRating}</span></>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">Completed</Badge>
                    <span className="text-sm font-semibold text-green-600">+${(earnings / 100).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
          {status === "CanLoadMore" && <Button variant="ghost" className="w-full" onClick={() => loadMore(25)}>Load more</Button>}
          {status === "LoadingMore" && <Skeleton className="h-10 w-full" />}
        </div>
      )}
    </div>
  );
}