'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

import Header from '../../../components/premium-travel/Header';
import Footer from '../../../components/premium-travel/Footer';
import { apiGet } from '../../../lib/api';
import { createDispatchSocket } from '../../../lib/dispatch-socket';
import type { DispatchSummaryResponse, DispatchUpdatesResponse, LiveLocation } from '../../../lib/dispatch-types';

const DispatchMap = dynamic(() => import('../../../components/dispatch/DispatchMap'), { ssr: false });

function formatTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function minutesUntil(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const ms = d.getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.round(ms / 60000);
}

export default function DispatchClient({
  token,
  initialSummary,
}: {
  token: string;
  initialSummary: DispatchSummaryResponse;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const [summary, setSummary] = useState<DispatchSummaryResponse | null>(initialSummary);
  const [updates, setUpdates] = useState<DispatchUpdatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  useEffect(() => {
    const socket = createDispatchSocket(token);

    function applyDriverLocation(loc: LiveLocation) {
      setUpdates((prev) => {
        if (!prev) return prev;
        if (!prev.driver) return prev;
        return { ...prev, driver: { ...prev.driver, location: loc } };
      });

      setSummary((prev) => {
        if (!prev) return prev;
        if (!prev.driver) return prev;
        return { ...prev, driver: { ...prev.driver, location: loc } };
      });
    }

    socket.on('dispatch.driver.location', (loc: LiveLocation) => {
      applyDriverLocation(loc);
    });

    socket.on('dispatch.driver.status', (journeyStatus: { status: string; updatedAt: string }) => {
      setUpdates((prev) => (prev ? { ...prev, journeyStatus } : prev));
      setSummary((prev) => (prev ? { ...prev, journeyStatus } : prev));
    });

    socket.on('dispatch.customer.location', (loc: LiveLocation) => {
      setUpdates((prev) => {
        if (!prev) return prev;
        return { ...prev, customer: { location: loc } };
      });
    });

    socket.on('connect_error', () => {
      // Keep silent; polling still works as fallback.
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token]);

  const prevStatusRef = useRef<string | null>(null);
  const prevTripStatusRef = useRef<string | null>(null);

  const pickup = useMemo(() => {
    const p = summary?.locations.pickup;
    if (!p?.lat || !p?.lon) return null;
    return { lat: p.lat, lon: p.lon, address: p.address };
  }, [summary]);

  const dropoff = useMemo(() => {
    const d = summary?.locations.dropoff;
    if (!d?.lat || !d?.lon) return null;
    return { lat: d.lat, lon: d.lon, address: d.address };
  }, [summary]);

  const route = summary?.route ?? null;

  async function loadSummary() {
    setError(null);
    const res = await apiGet<DispatchSummaryResponse>(`/v1/dispatch/${encodeURIComponent(token)}`);
    setSummary(res);
    prevStatusRef.current = res.booking.status;
    prevTripStatusRef.current = res.trip?.status ?? null;
  }

  async function loadUpdates() {
    const res = await apiGet<DispatchUpdatesResponse>(`/v1/dispatch/${encodeURIComponent(token)}/updates`);
    setUpdates(res);

    const nextBookingStatus = res.booking.status;
    const nextTripStatus = res.trip?.status ?? null;

    const prevBookingStatus = prevStatusRef.current;
    const prevTripStatus = prevTripStatusRef.current;

    const changed = (prevBookingStatus && prevBookingStatus !== nextBookingStatus) || (prevTripStatus && prevTripStatus !== nextTripStatus);

    if (changed && notifyEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const title = 'Trip update';
      const body = nextTripStatus ? `Trip status: ${nextTripStatus}` : `Booking status: ${nextBookingStatus}`;
      try {
        // eslint-disable-next-line no-new
        new Notification(title, { body });
      } catch {
        // ignore
      }
    }

    prevStatusRef.current = nextBookingStatus;
    prevTripStatusRef.current = nextTripStatus;
  }

  useEffect(() => {
    // initial summary was server-fetched; just prime the status refs
    prevStatusRef.current = initialSummary.booking.status;
    prevTripStatusRef.current = initialSummary.trip?.status ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSummary.booking.status, initialSummary.trip?.status]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadUpdates();
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadUpdates().catch(() => {
        // keep UI stable; errors show on manual refresh
      });
    }, 10_000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, notifyEnabled]);

  const etaIso = updates?.eta ?? null;
  const etaMins = minutesUntil(etaIso);

  const title = summary?.booking.bookingNumber ? `Journey ${summary.booking.bookingNumber}` : 'Live Journey';

  const driverLocation = updates?.driver?.location ?? summary?.driver?.location ?? null;

  const showCompleted = updates?.trip?.status?.toLowerCase?.() === 'completed' || updates?.booking.status?.toLowerCase?.() === 'completed';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} showNav={false} showLoginLink={false} showBookNowButton={false} />

      <main className="w-full px-4 md:px-10 py-8 md:py-12">
        <div className="max-w-6xl mx-auto grid gap-6">
          <section className="rounded-[28px] bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 shadow-3xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="grid gap-2">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-200">TransferLane</div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                  {title}
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-200 font-medium leading-relaxed max-w-2xl">
                  Live location, ETA, and trip details. This link is private — only share it with trusted contacts.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-3">
                <button
                  className="px-5 py-3 rounded-[18px] border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] hover:border-primary/50 hover:text-primary transition-all"
                  onClick={() => void loadSummary().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                >
                  Refresh
                </button>

                <button
                  className="px-5 py-3 rounded-[18px] bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all"
                  onClick={async () => {
                    if (!('Notification' in window)) return;
                    const perm = await Notification.requestPermission();
                    setNotifyEnabled(perm === 'granted');
                  }}
                >
                  {notifyEnabled ? 'Notifications enabled' : 'Enable notifications'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200 font-medium">
                {error}
              </div>
            ) : null}

            {showCompleted ? (
              <div className="mt-6 rounded-2xl border border-green-200 dark:border-green-500/30 bg-green-50/80 dark:bg-green-500/10 p-4 text-sm text-green-900 dark:text-green-200 font-medium">
                Trip completed.
              </div>
            ) : null}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">Status</div>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                  {updates?.trip?.status ?? summary?.booking.status ?? '—'}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">Updated: {formatTime(updates?.updatedAt ?? summary?.updatedAt ?? null)}</div>
              </div>

              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">ETA</div>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{formatTime(etaIso)}</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">
                  {etaMins === null ? '—' : etaMins >= 0 ? `${etaMins} min` : `${Math.abs(etaMins)} min ago`}
                </div>
              </div>

              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">Pickup time</div>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{formatTime(summary?.booking.scheduledPickupAt ?? null)}</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">From: {summary?.locations.pickup.address ?? '—'}</div>
              </div>

              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">Destination</div>
                <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{summary?.locations.dropoff.address ?? '—'}</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">
                  {updates?.telemetry.distanceKm ? `${updates.telemetry.distanceKm} km` : '—'}
                  {updates?.telemetry.durationMin ? ` • ${updates.telemetry.durationMin} min` : ''}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 shadow-3xl">
            <div className="p-6 md:p-10 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display">Live map</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-200 font-medium">
                Shows the route and the latest taxi position (when available).
              </p>
            </div>
            <div className="h-[56vh] min-h-[340px]">
              <DispatchMap pickup={pickup} dropoff={dropoff} route={route} driverLocation={driverLocation} />
            </div>
          </section>

          <section className="rounded-[28px] bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 shadow-3xl p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display">Trip details</h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">Current location</div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {driverLocation
                    ? `${driverLocation.lat.toFixed(5)}, ${driverLocation.lon.toFixed(5)}`
                    : 'Waiting for live location…'}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">
                  {updates?.driver?.location?.recordedAt ? `Recorded: ${formatTime(updates.driver.location.recordedAt)}` : '—'}
                </div>
              </div>

              <div className="rounded-[22px] bg-slate-50 dark:bg-surface-dark border border-slate-200/60 dark:border-white/10 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200">Route</div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {summary ? `${summary.locations.pickup.address} → ${summary.locations.dropoff.address}` : '—'}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200 font-medium">
                  {route ? `${route.length} points` : '—'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
