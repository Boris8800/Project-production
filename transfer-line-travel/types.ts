
export enum TripType {
  ONE_WAY = 'One-way',
  ROUND_TRIP = 'Round-trip'
}

export enum BookingCategory {
  INTERCITY = 'Intercity',
  AIRPORT = 'Airport Transfer'
}

export enum Language {
  EN = 'en',
  ES = 'es',
  DE = 'de',
  FR = 'fr'
}

export interface Vehicle {
  id: string;
  name: string;
  description: string;
  pricePerMile: number;
  capacity: number;
  luggage: number;
  amenities: string[];
  image: string;
}

export interface Recommendation {
  route: string;
  highlights: string[];
  estimatedTime: string;
  estimatedPrice: string;
}

export interface RideData {
  pickup: string;
  dropoff: string;
  date: string;
  pickupTime: string;
  persons: number;
  luggage: number;
}
