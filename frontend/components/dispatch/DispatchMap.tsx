'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

type LatLon = { lat: number; lon: number };

function FitBounds({ points }: { points: LatLon[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, points]);

  return null;
}

const taxiIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:18px;height:18px;border-radius:9999px;background:#C89D2B;border:3px solid rgba(255,255,255,0.95);box-shadow:0 10px 25px rgba(0,0,0,0.25)"></div>
  `.trim(),
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="width:14px;height:14px;border-radius:9999px;background:${color};border:3px solid rgba(255,255,255,0.95);box-shadow:0 10px 25px rgba(0,0,0,0.2)"></div>
    `.trim(),
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

export default function DispatchMap({
  pickup,
  dropoff,
  route,
  driverLocation,
}: {
  pickup: (LatLon & { address: string }) | null;
  dropoff: (LatLon & { address: string }) | null;
  route: LatLon[] | null;
  driverLocation: LatLon | null;
}) {
  const baseCenter = useMemo(() => {
    if (pickup) return [pickup.lat, pickup.lon] as [number, number];
    if (dropoff) return [dropoff.lat, dropoff.lon] as [number, number];
    return [51.5074, -0.1278] as [number, number];
  }, [pickup, dropoff]);

  const boundsPoints = useMemo(() => {
    const pts: LatLon[] = [];
    if (pickup) pts.push(pickup);
    if (dropoff) pts.push(dropoff);
    if (driverLocation) pts.push(driverLocation);
    if (route?.length) pts.push(...route);
    return pts;
  }, [pickup, dropoff, driverLocation, route]);

  return (
    <MapContainer center={baseCenter} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route?.length ? <Polyline positions={route.map((p) => [p.lat, p.lon] as [number, number])} pathOptions={{ color: '#C89D2B', weight: 5, opacity: 0.9 }} /> : null}

      {pickup ? <Marker position={[pickup.lat, pickup.lon]} icon={pinIcon('#16a34a')} /> : null}
      {dropoff ? <Marker position={[dropoff.lat, dropoff.lon]} icon={pinIcon('#dc2626')} /> : null}

      {driverLocation ? <Marker position={[driverLocation.lat, driverLocation.lon]} icon={taxiIcon} /> : null}

      {boundsPoints.length ? <FitBounds points={boundsPoints} /> : null}
    </MapContainer>
  );
}
