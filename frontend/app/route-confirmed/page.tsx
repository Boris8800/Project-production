"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import VehicleSelection from '../../components/premium-travel/VehicleSelection';
import type { RideData, SelectedVehicle } from '../../components/premium-travel/types';

export default function RouteConfirmedPage() {
  const router = useRouter();

  const rideData = useMemo<RideData>(
    () => ({
      pickup: 'London Heathrow Airport (LHR)',
      dropoff: 'London (Central)',
      stops: [],
      date: new Date().toISOString().slice(0, 10),
      time: '12:00',
      persons: 2,
      luggage: 2,
    }),
    [],
  );

  const handleSelect = (vehicle: SelectedVehicle) => {
    // This page is for previewing the Route Confirmed UI.
    // Navigate back home after a selection, or adjust as needed.
    console.log('Selected vehicle:', vehicle);
    router.push('/');
  };

  return (
    <VehicleSelection
      rideData={rideData}
      onSelect={handleSelect}
      onBack={() => router.push('/')}
    />
  );
}
