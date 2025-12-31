export type LatLon = { lat: number; lon: number };

export type JourneyStatus = {
  status: string;
  updatedAt: string;
};

export type LiveLocation = LatLon & {
  heading: number | null;
  speedMps: number | null;
  accuracyM: number | null;
  recordedAt: string;
};

export type DispatchLinkMeta = {
  kind: 'customer' | 'driver';
  createdAt: string;
};

export type DispatchSummaryResponse = {
  ok: true;
  updatedAt: string;
  link?: DispatchLinkMeta;
  booking: {
    id: string;
    bookingNumber: string | null;
    status: string;
    scheduledPickupAt: string | null;
    estimatedDistanceM: number | null;
    estimatedDurationS: number | null;
  };
  locations: {
    pickup: { address: string; lat: number | null; lon: number | null };
    dropoff: { address: string; lat: number | null; lon: number | null };
  };
  trip:
    | {
        id: string;
        status: string;
        startedAt: string | null;
        completedAt: string | null;
      }
    | null;
  journeyStatus?: JourneyStatus | null;
  route: Array<LatLon> | null;
  driver:
    | {
        id: string;
        location: LiveLocation | null;
      }
    | null;
};

export type DispatchUpdatesResponse = {
  ok: true;
  updatedAt: string;
  link?: DispatchLinkMeta;
  booking: { id: string; status: string };
  trip: { id: string; status: string; startedAt: string | null; completedAt: string | null } | null;
  journeyStatus?: JourneyStatus | null;
  eta: string | null;
  driver: { id: string; location: LiveLocation | null } | null;
  customer?: { location: LiveLocation | null };
  telemetry: { distanceKm: number | null; durationMin: number | null };
};
