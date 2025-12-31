'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

import { apiGet } from '../../../../lib/api';
import { createDispatchSocket } from '../../../../lib/dispatch-socket';
import type { DispatchSummaryResponse, DispatchUpdatesResponse, LiveLocation } from '../../../../lib/dispatch-types';

const DispatchMap = dynamic(() => import('../../../../components/dispatch/DispatchMap'), { ssr: false });

type LatLonAddress = { lat: number; lon: number; address: string };

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function DriverClient({
  token,
  initialSummary,
}: {
  token: string;
  initialSummary: DispatchSummaryResponse;
}) {
  const [summary, setSummary] = useState<DispatchSummaryResponse | null>(initialSummary);
  const [updates, setUpdates] = useState<DispatchUpdatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<ReturnType<typeof createDispatchSocket> | null>(null);

  const pickup = useMemo(() => {
    const p = summary?.locations.pickup;
    if (!p?.lat || !p?.lon) return null;
    return { lat: p.lat, lon: p.lon, address: p.address } satisfies LatLonAddress;
  }, [summary]);

  const dropoff = useMemo(() => {
    const d = summary?.locations.dropoff;
    if (!d?.lat || !d?.lon) return null;
    return { lat: d.lat, lon: d.lon, address: d.address } satisfies LatLonAddress;
  }, [summary]);

  const route = summary?.route ?? null;

  async function loadSummary() {
    setError(null);
    const res = await apiGet<DispatchSummaryResponse>(`/v1/dispatch/${encodeURIComponent(token)}`);
    setSummary(res);
  }

  async function loadUpdates() {
    const res = await apiGet<DispatchUpdatesResponse>(`/v1/dispatch/${encodeURIComponent(token)}/updates`);
    setUpdates(res);
  }

  useEffect(() => {
    loadUpdates().catch((e) => setError(e instanceof Error ? e.message : String(e)));
    const id = window.setInterval(() => {
      loadUpdates().catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const socket = createDispatchSocket(token);
    socketRef.current = socket;

    socket.on('dispatch.driver.location', (loc: LiveLocation) => {
      setUpdates((prev) => (prev && prev.driver ? { ...prev, driver: { ...prev.driver, location: loc } } : prev));
      setSummary((prev) => (prev && prev.driver ? { ...prev, driver: { ...prev.driver, location: loc } } : prev));
    });

    socket.on('dispatch.driver.status', (journeyStatus: { status: string; updatedAt: string }) => {
      setUpdates((prev) => (prev ? { ...prev, journeyStatus } : prev));
      setSummary((prev) => (prev ? { ...prev, journeyStatus } : prev));
    });

    socket.on('dispatch.customer.location', (loc: LiveLocation) => {
      setUpdates((prev) => (prev ? { ...prev, customer: { location: loc } } : prev));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  function startSharing() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setError(null);

    const socket = socketRef.current;
    if (!socket) {
      setError('Live connection not ready yet. Please try again.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        socket.emit('dispatch.driver.location', {
          lat: latitude,
          lon: longitude,
          heading: typeof heading === 'number' ? heading : undefined,
          speedMps: typeof speed === 'number' ? speed : undefined,
          accuracyM: typeof accuracy === 'number' ? accuracy : undefined,
        });
        setLastSentAt(new Date().toISOString());
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10_000 },
    );

    watchIdRef.current = watchId;
    setSharing(true);
  }

  function stopSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  function sendStatus(status: string) {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('dispatch.driver.status', { status });
  }

  const journeyStatus = updates?.journeyStatus ?? summary?.journeyStatus ?? null;
  const driverLocation = updates?.driver?.location ?? summary?.driver?.location ?? null;
  const customerLocation = updates?.customer?.location ?? null;

  const canSeeDropoff =
    journeyStatus?.status === 'PASSENGER_ON_BOARD' ||
    journeyStatus?.status === 'DROPOFF' ||
    journeyStatus?.status === 'TRIP_COMPLETED';

  const effectiveDropoff = canSeeDropoff ? dropoff : null;
  const effectiveRoute = canSeeDropoff ? route : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-300">Driver Panel</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
              {summary?.booking.bookingNumber ? `Trip ${summary.booking.bookingNumber}` : 'Trip'}
            </h1>
            <div className="mt-2 text-sm text-slate-300 font-medium">
              Pickup time: {formatTime(summary?.booking.scheduledPickupAt)}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-black text-xs uppercase tracking-widest"
              onClick={() => loadSummary().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-sm font-medium">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">Map</div>
              <div className="mt-2 text-sm text-slate-300 font-medium">
                Driver: {driverLocation ? `${driverLocation.lat.toFixed(5)}, ${driverLocation.lon.toFixed(5)}` : 'Waiting for location…'}
              </div>
              <div className="mt-1 text-xs text-slate-400 font-medium">
                Last sent: {formatTime(lastSentAt)}
              </div>
            </div>
            <div className="h-[420px]">
              <DispatchMap
                pickup={pickup}
                dropoff={effectiveDropoff}
                route={effectiveRoute}
                driverLocation={driverLocation ? { lat: driverLocation.lat, lon: driverLocation.lon } : null}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">Location Sharing</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {!sharing ? (
                  <button
                    className="px-5 py-3 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest"
                    onClick={startSharing}
                  >
                    Start sharing
                  </button>
                ) : (
                  <button
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-black text-xs uppercase tracking-widest"
                    onClick={stopSharing}
                  >
                    Stop sharing
                  </button>
                )}
              </div>
              {customerLocation ? (
                <div className="mt-4 text-sm text-slate-200 font-medium">
                  Customer location: {customerLocation.lat.toFixed(5)}, {customerLocation.lon.toFixed(5)}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">Status</div>
              <div className="mt-2 text-sm text-slate-200 font-medium">
                Current: {journeyStatus ? `${journeyStatus.status} (${formatTime(journeyStatus.updatedAt)})` : '—'}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['DRIVER_ARRIVED', 'ON_ROUTE', 'PASSENGER_ON_BOARD', 'DROPOFF', 'TRIP_COMPLETED'].map((s) => (
                  <button
                    key={s}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-black text-xs uppercase tracking-widest text-left"
                    onClick={() => sendStatus(s)}
                  >
                    {s.replaceAll('_', ' ')}
                  </button>
                 ))}
               </div>
             </div>
 
             <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
               <div className="text-xs font-black uppercase tracking-widest text-slate-300">Trip Info</div>
               <div className="mt-3 text-sm text-slate-200 font-medium">Pickup: {summary?.locations.pickup.address ?? '—'}</div>
              <div className="mt-1 text-sm text-slate-200 font-medium">
                Drop-off: {canSeeDropoff ? (summary?.locations.dropoff.address ?? '—') : 'Hidden until passenger on board'}
              </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
