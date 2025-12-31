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

function estimateFromText(pickup: string, dropoff: string) {
  const seed = pickup.length + dropoff.length;
  const miles = Math.floor(seed * 1.8 + 20);
  const speedAverage = 55;
  const hours = Math.floor(miles / speedAverage);
  const mins = Math.floor(((miles % speedAverage) / speedAverage) * 60);
  const durationSeconds = hours * 3600 + mins * 60;

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
    const est = estimateFromText(pickup, dropoff);
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
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('units', 'imperial');
    url.searchParams.set('key', key);

    const resp = await fetch(url.toString(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('directions_fetch_failed');

    const data = (await resp.json()) as DirectionsResponse;
    const leg = data?.routes?.[0]?.legs?.[0];

    const meters: number | undefined = typeof leg?.distance?.value === 'number' ? leg.distance.value : undefined;
    const seconds: number | undefined = typeof leg?.duration?.value === 'number' ? leg.duration.value : undefined;

    if (!meters || !seconds) throw new Error('directions_parse_failed');

    const miles = Math.round(meters / 1609.344);

    return NextResponse.json(
      {
        distanceMiles: miles,
        durationSeconds: seconds,
        durationText: durationTextFromSeconds(seconds),
        arrivalEpochMs: Date.now() + seconds * 1000,
        source: 'google',
      },
      { status: 200 },
    );
  } catch {
    const est = estimateFromText(pickup, dropoff);
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
