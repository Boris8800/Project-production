import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type DirectionsResponse = {
  routes?: Array<{
    legs?: Array<{
      distance?: { value?: number };
      duration?: { value?: number };
    }>;
  }>;
};

function estimateFromText(pickup: string, dropoff: string, stops: string[] = []) {
  const stopsCount = stops.length;
  const seed = pickup.length + dropoff.length + stops.join('').length;
  const miles = Math.floor(seed * 1.8 + 20 + (stopsCount * 5));
  const speedAverage = 55;
  const totalMins = Math.floor((miles / speedAverage) * 60) + (stopsCount * 15);
  const durationSeconds = totalMins * 60;

  return { miles, durationSeconds };
}

function durationTextFromSeconds(durationSeconds: number) {
  const totalMins = Math.max(0, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pickup = (searchParams.get('pickup') || '').trim();
  const dropoff = (searchParams.get('dropoff') || '').trim();
  const stopsRaw = searchParams.get('stops');
  const stops = stopsRaw ? stopsRaw.split('|').filter(Boolean) : [];

  if (!pickup || !dropoff) {
    return NextResponse.json(
      {
        distanceMiles: 0,
        durationSeconds: 0,
        durationText: '0m',
        arrivalEpochMs: Date.now(),
        source: 'estimate',
      },
      { status: 200 },
    );
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;

  // Fallback estimate if no Google key is configured.
  if (!key) {
    const est = estimateFromText(pickup, dropoff, stops);
    return NextResponse.json(
      {
        distanceMiles: est.miles,
        durationSeconds: est.durationSeconds,
        durationText: durationTextFromSeconds(est.durationSeconds),
        arrivalEpochMs: Date.now() + est.durationSeconds * 1000,
        source: 'estimate',
      },
      { status: 200 },
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', pickup);
    url.searchParams.set('destination', dropoff);
    if (stops.length > 0) {
      url.searchParams.set('waypoints', stops.join('|'));
    }
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('units', 'imperial');
    url.searchParams.set('key', key);

    const resp = await fetch(url.toString(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('directions_fetch_failed');

    const data = (await resp.json()) as DirectionsResponse;
    
    // When using waypoints, we should sum up all legs
    const legs = data?.routes?.[0]?.legs || [];
    let totalMeters = 0;
    let totalSeconds = 0;

    for (const leg of legs) {
      totalMeters += leg.distance?.value || 0;
      totalSeconds += leg.duration?.value || 0;
    }

    if (totalMeters === 0 || totalSeconds === 0) throw new Error('directions_parse_failed');

    const miles = Math.round(totalMeters / 1609.344);

    return NextResponse.json(
      {
        distanceMiles: miles,
        durationSeconds: totalSeconds,
        durationText: durationTextFromSeconds(totalSeconds),
        arrivalEpochMs: Date.now() + totalSeconds * 1000,
        source: 'google',
      },
      { status: 200 },
    );
  } catch {
    const est = estimateFromText(pickup, dropoff, stops);
    return NextResponse.json(
      {
        distanceMiles: est.miles,
        durationSeconds: est.durationSeconds,
        durationText: durationTextFromSeconds(est.durationSeconds),
        arrivalEpochMs: Date.now() + est.durationSeconds * 1000,
        source: 'estimate',
      },
      { status: 200 },
    );
  }
}
