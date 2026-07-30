import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeCircleIcon(color: string, label: string) {
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;">${label}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

const PICKUP_ICON = makeCircleIcon("#22c55e", "A");
const DROPOFF_ICON = makeCircleIcon("#ef4444", "B");
const DRIVER_ICON = makeCircleIcon("#3b82f6", "\u2726");

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    fitted.current = true;
  }, [map, positions]);
  return null;
}

function PanToDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    const curr: [number, number] = [lat, lng];
    if (!prev.current || prev.current[0] !== lat || prev.current[1] !== lng) {
      map.panTo(curr, { animate: true, duration: 0.8 });
      prev.current = curr;
    }
  }, [map, lat, lng]);
  return null;
}

export type TripMapProps = {
  pickup: { lat: number; lng: number; address: string } | null;
  dropoff: { lat: number; lng: number; address: string } | null;
  driver?: { lat: number; lng: number; name?: string } | null;
  tripPath?: Array<{ lat: number; lng: number }>;
  heightClass?: string;
  panOnDriverMove?: boolean;
};

export default function TripMap({ pickup, dropoff, driver, tripPath = [], heightClass = "h-64", panOnDriverMove = false }: TripMapProps) {
  const fitPositions: [number, number][] = [];
  if (pickup && pickup.lat !== 0) fitPositions.push([pickup.lat, pickup.lng]);
  if (dropoff && dropoff.lat !== 0) fitPositions.push([dropoff.lat, dropoff.lng]);
  if (driver) fitPositions.push([driver.lat, driver.lng]);
  const centre: [number, number] = fitPositions.length > 0 ? fitPositions[0] : [51.505, -0.09];
  const pathLine: [number, number][] = tripPath.map((p) => [p.lat, p.lng]);
  return (
    <div className={`${heightClass} w-full rounded-xl overflow-hidden border border-border shadow-sm`}>
      <MapContainer center={centre} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {!panOnDriverMove && fitPositions.length > 0 && <FitBounds positions={fitPositions} />}
        {panOnDriverMove && driver && <PanToDriver lat={driver.lat} lng={driver.lng} />}
        {pickup && pickup.lat !== 0 && <Marker position={[pickup.lat, pickup.lng]} icon={PICKUP_ICON}><Popup>{pickup.address}</Popup></Marker>}
        {dropoff && dropoff.lat !== 0 && <Marker position={[dropoff.lat, dropoff.lng]} icon={DROPOFF_ICON}><Popup>{dropoff.address}</Popup></Marker>}
        {driver && <Marker position={[driver.lat, driver.lng]} icon={DRIVER_ICON}><Popup>{driver.name ?? "Driver"}</Popup></Marker>}
        {pathLine.length > 1 && <Polyline positions={pathLine} color="#3b82f6" weight={3} opacity={0.7} />}
      </MapContainer>
    </div>
  );
}