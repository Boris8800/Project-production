"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { BookingCategory, RideData, TripType } from './types';
import { useLanguage, Language } from '../../lib/language';

interface HeroProps {
  activeCategory: BookingCategory;
  setActiveCategory: (cat: BookingCategory) => void;
  onEstimate?: (data: RideData) => void;
}

const Hero: React.FC<HeroProps> = ({ activeCategory, setActiveCategory, onEstimate }) => {
  const { language } = useLanguage();

  const leadTimeMs = 5 * 60 * 60 * 1000;
  const minAllowed = useMemo(() => new Date(Date.now() + leadTimeMs), [leadTimeMs]);
  const minAllowedDate = useMemo(() => minAllowed.toISOString().split('T')[0], [minAllowed]);
  const minAllowedTime = useMemo(() => minAllowed.toTimeString().slice(0, 5), [minAllowed]);

  const [tripType, setTripType] = useState<TripType>(TripType.ONE_WAY);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState(() => minAllowedDate);
  const [time, setTime] = useState(() => minAllowedTime);
  const [persons, setPersons] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [placesReady, setPlacesReady] = useState(false);

  const pickupInputRef = useRef<HTMLInputElement | null>(null);
  const dropoffInputRef = useRef<HTMLInputElement | null>(null);
  const placesBoundRef = useRef(false);


  const minTimeForSelectedDate = useMemo(() => {
    return date === minAllowedDate ? minAllowedTime : undefined;
  }, [date, minAllowedDate, minAllowedTime]);

  const canSubmit = Boolean(pickup.trim() && dropoff.trim() && date && time);

  type GooglePlaceResult = {
    formatted_address?: string;
    name?: string;
    place_id?: string;
  };

  type GoogleAutocomplete = {
    addListener: (eventName: 'place_changed', handler: () => void) => void;
    getPlace: () => GooglePlaceResult;
  };

  type GoogleMapsPlaces = {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          opts?: {
            fields?: string[];
            types?: string[];
            componentRestrictions?: { country?: string | string[] };
          },
        ) => GoogleAutocomplete;
      };
    };
  };

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapsKey) return;
    if (!placesReady) return;
    if (placesBoundRef.current) return;
    if (!pickupInputRef.current || !dropoffInputRef.current) return;

    const googleObj = (window as unknown as { google?: GoogleMapsPlaces }).google;
    const AutocompleteCtor = googleObj?.maps?.places?.Autocomplete;
    if (!AutocompleteCtor) return;

    const commonOptions = {
      fields: ['formatted_address', 'name', 'place_id'],
      types: ['geocode'],
      componentRestrictions: { country: 'uk' },
    };

    const pickupAutocomplete = new AutocompleteCtor(pickupInputRef.current, commonOptions);
    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      const value = place.formatted_address || place.name;
      if (value) setPickup(value);
    });

    const dropoffAutocomplete = new AutocompleteCtor(dropoffInputRef.current, commonOptions);
    dropoffAutocomplete.addListener('place_changed', () => {
      const place = dropoffAutocomplete.getPlace();
      const value = place.formatted_address || place.name;
      if (value) setDropoff(value);
    });

    placesBoundRef.current = true;
  }, [mapsKey, placesReady]);

  const handleSearch = async () => {
    setFormError(null);
    if (!pickup.trim() || !dropoff.trim()) return;

    if (!date || !time) {
      setFormError('Please choose a pickup date and time.');
      return;
    }

    const pickupAt = new Date(`${date}T${time}:00`);
    const earliestAllowed = Date.now() + leadTimeMs;
    if (Number.isNaN(pickupAt.getTime()) || pickupAt.getTime() < earliestAllowed) {
      setFormError('Pickup date/time must be at least 5 hours from now.');
      return;
    }

    setLoading(true);
    const rideData: RideData = { pickup: pickup.trim(), dropoff: dropoff.trim(), date, time, persons, luggage };
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    if (onEstimate) onEstimate(rideData);
  };

  const increment = (setter: React.Dispatch<React.SetStateAction<number>>, val: number, max: number) => {
    if (val < max) setter(val + 1);
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, val: number, min: number) => {
    if (val > min) setter(val - 1);
  };

  const translations = {
    [Language.EN]: {
      badge: 'The Elite Standard',
      headlineA: 'Across Britain',
      headlineB: 'In Refinement',
      sub: 'Premium intercity travel throughout the UK. Experience superior service without the compromise.',
      licensed: 'Licensed',
      secure: 'Secure',
      rated: '5-Star Rated',
      intercity: 'Intercity',
      airport: 'Airport Transfer',
      oneWay: 'One-way',
      roundTrip: 'Round-trip',
      pickupPl: 'Collection Address',
      dropoffPl: 'Destination Address',
      passengers: 'Passengers',
      bags: 'Bags',
      quote: 'Generate Instant Quote',
      fixedPricing: 'Fixed pricing. No hidden fees. Guaranteed.',
    },
    [Language.ES]: {
      badge: 'El Estándar de Élite',
      headlineA: 'Por Gran Bretaña',
      headlineB: 'Con Refinamiento',
      sub: 'Viajes interurbanos premium por todo el Reino Unido. Un servicio superior sin concesiones.',
      licensed: 'Con licencia',
      secure: 'Seguro',
      rated: '5 Estrellas',
      intercity: 'Interurbano',
      airport: 'Traslado al Aeropuerto',
      oneWay: 'Solo ida',
      roundTrip: 'Ida y vuelta',
      pickupPl: 'Dirección de recogida',
      dropoffPl: 'Dirección de destino',
      passengers: 'Pasajeros',
      bags: 'Maletas',
      quote: 'Obtener presupuesto',
      fixedPricing: 'Precio fijo. Sin cargos ocultos. Garantizado.',
    },
    [Language.FR]: {
      badge: "L'Excellence", 
      headlineA: 'À Travers la Grande-Bretagne',
      headlineB: 'Avec Raffinement',
      sub: "Voyages interurbains premium dans tout le Royaume-Uni. Un service supérieur sans compromis.",
      licensed: 'Agréé',
      secure: 'Sécurisé',
      rated: '5 Étoiles',
      intercity: 'Interurbain',
      airport: 'Transfert Aéroport',
      oneWay: 'Aller simple',
      roundTrip: 'Aller-retour',
      pickupPl: 'Adresse de prise en charge',
      dropoffPl: 'Adresse de destination',
      passengers: 'Passagers',
      bags: 'Bagages',
      quote: 'Obtenir un devis',
      fixedPricing: 'Tarif fixe. Aucun frais caché. Garanti.',
    },
    [Language.DE]: {
      badge: 'Elite-Standard',
      headlineA: 'Durch Großbritannien',
      headlineB: 'Mit Raffinesse',
      sub: 'Premium-Fernfahrten in ganz Großbritannien. Erstklassiger Service ohne Kompromisse.',
      licensed: 'Lizenziert',
      secure: 'Sicher',
      rated: '5-Sterne',
      intercity: 'Fernfahrt',
      airport: 'Flughafentransfer',
      oneWay: 'Einweg',
      roundTrip: 'Hin & zurück',
      pickupPl: 'Abholadresse',
      dropoffPl: 'Zieladresse',
      passengers: 'Fahrgäste',
      bags: 'Gepäck',
      quote: 'Sofortangebot erstellen',
      fixedPricing: 'Festpreis. Keine versteckten Gebühren. Garantiert.',
    },
  } as const;

  const t = translations[language];

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center px-4 md:px-12 overflow-hidden bg-background-dark">
      {mapsKey ? (
        <Script
          id="google-maps-places"
          strategy="afterInteractive"
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsKey)}&libraries=places&v=weekly`}
          onLoad={() => setPlacesReady(true)}
        />
      ) : null}
      {/* Background with deeper overlay for better text contrast */}
      <div 
        className="absolute -inset-px z-0 bg-cover bg-center hero-bg-animate" 
        style={{ backgroundImage: `linear-gradient(rgba(10, 10, 20, 0.75), rgba(10, 10, 20, 0.98)), url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400')` }}
      />

      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(10,10,20,0.55)_100%)]" />
      
      <div className="relative z-10 w-full flex flex-col lg:flex-row gap-20 items-center">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">{t.badge}</span>
          </div>
          <h1 className="text-6xl lg:text-[110px] font-black text-white mb-8 leading-[0.85] tracking-tighter">
            {t.headlineA}<br/>
            <span className="text-primary italic font-display">{t.headlineB}</span>
          </h1>
          <p className="text-slate-300 text-xl lg:text-2xl max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            {t.sub}
          </p>
          
          <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-10 opacity-70">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">verified</span>
              <span className="text-[12px] font-bold text-white uppercase tracking-widest">{t.licensed}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">lock</span>
              <span className="text-[12px] font-bold text-white uppercase tracking-widest">{t.secure}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">star</span>
              <span className="text-[12px] font-bold text-white uppercase tracking-widest">{t.rated}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[650px] bg-white dark:bg-surface-dark/95 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8 lg:p-14 border border-gray-200 dark:border-white/10 transform transition-all">
          <div className="flex border-b border-gray-200 dark:border-white/5 mb-10">
            {[BookingCategory.INTERCITY, BookingCategory.AIRPORT].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`flex-1 pb-6 text-lg font-black transition-all ${activeCategory === cat ? 'border-b-4 border-primary text-primary' : 'text-slate-400 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {cat === BookingCategory.INTERCITY ? t.intercity : t.airport}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            <div className="flex p-2 bg-slate-50 dark:bg-background-dark/50 rounded-2xl border border-slate-200 dark:border-white/5">
              {[TripType.ONE_WAY, TripType.ROUND_TRIP].map((type) => (
                <button 
                  key={type} 
                  onClick={() => setTripType(type)} 
                  className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${tripType === type ? 'bg-white dark:bg-surface-dark-lighter shadow-lg text-primary scale-[1.02]' : 'text-slate-400 dark:text-slate-200 hover:text-primary'}`}
                >
                  {type === TripType.ONE_WAY ? t.oneWay : t.roundTrip}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-2xl group-focus-within:scale-110 transition-transform">my_location</span>
                <input 
                  type="text" 
                  value={pickup} 
                  onChange={(e) => setPickup(e.target.value)} 
                  ref={pickupInputRef}
                  className={`w-full pl-16 pr-8 py-6 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 font-bold transition-all outline-none text-slate-900 dark:text-white ${language === Language.DE ? 'text-sm' : 'text-lg'}`}
                  placeholder={t.pickupPl} 
                  autoComplete="off"
                />
              </div>

              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-2xl group-focus-within:scale-110 transition-transform">location_on</span>
                <input 
                  type="text" 
                  value={dropoff} 
                  onChange={(e) => setDropoff(e.target.value)} 
                  ref={dropoffInputRef}
                  className={`w-full pl-16 pr-8 py-6 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 font-bold transition-all outline-none text-slate-900 dark:text-white ${language === Language.DE ? 'text-sm' : 'text-lg'}`}
                  placeholder={t.dropoffPl} 
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Selection */}
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl">calendar_month</span>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    min={minAllowedDate}
                    className="w-full pl-14 pr-4 py-5 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white" 
                  />
                </div>

                {/* Time Selection */}
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl">schedule</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    min={minTimeForSelectedDate}
                    className="w-full pl-14 pr-4 py-5 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                  />
                </div>
                
                {/* Passengers Counter */}
                <div className="flex items-center justify-between px-5 py-3 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-200">{t.passengers}</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{persons}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => decrement(setPersons, persons, 1)}
                      className="size-7 rounded-lg flex items-center justify-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 hover:text-primary transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <button 
                      onClick={() => increment(setPersons, persons, 8)}
                      className="size-7 rounded-lg flex items-center justify-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 hover:text-primary transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                </div>

                {/* Bags Counter */}
                <div className="flex items-center justify-between px-5 py-3 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-200">{t.bags}</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-lg">luggage</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{luggage}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => decrement(setLuggage, luggage, 0)}
                      className="size-7 rounded-lg flex items-center justify-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 hover:text-primary transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <button 
                      onClick={() => increment(setLuggage, luggage, 12)}
                      className="size-7 rounded-lg flex items-center justify-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 hover:text-primary transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSearch} 
              disabled={loading || !canSubmit} 
              className={`group relative w-full overflow-hidden p-7 bg-primary text-white font-black rounded-[24px] shadow-2xl shadow-primary/40 hover:bg-primary-dark transition-all transform active:scale-[0.98] disabled:opacity-50 ${language === Language.DE ? 'text-base' : 'text-xl'}`}
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                {loading ? (
                   <span className="animate-spin material-symbols-outlined text-2xl">sync</span>
                ) : (
                  <>
                    <span>{t.quote}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-2xl">arrow_forward</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {formError ? (
              <p className="text-center text-xs font-bold text-red-600 dark:text-red-300 mt-4">
                {formError}
              </p>
            ) : null}
            
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-200 font-bold uppercase tracking-[0.2em] mt-6">
              {t.fixedPricing}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
