/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useMemo, useState } from 'react';
import { RideData, SelectedVehicle } from './types';
import { useLanguage, Language } from '../../lib/language';

interface VehicleSelectionProps {
  rideData: RideData;
  onSelect: (vehicle: SelectedVehicle) => void;
  onBack: () => void;
}


const VehicleSelection: React.FC<VehicleSelectionProps> = ({ rideData, onSelect, onBack }) => {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const translations = {
    [Language.EN]: {
      back: 'Return to Search', badge: 'Route Confirmed', title: 'Your Custom Journey',
      dist: 'Distance', time: 'Est. Time', collection: 'Collection', destination: 'Destination',
      priceNote: 'Your price is fixed and all-inclusive. It includes the {miles} mile route, UK motorway tolls, and 15 minutes of complimentary waiting time.',
      chooseVehicle: 'Choose Your Carriage', bigCarInfo: 'Showing bigger cars for your group size & luggage.',
      passengers: 'Passengers', items: 'Items', fixedQuote: 'Fixed Quote', base: 'Base', mile: 'Mile',
      seats: 'Seats', bags: 'Bags', eliteDriver: 'Elite Driver', available: 'Available Now',
      confirm: 'Confirm Choice', select: 'Select Vehicle', noVehicles: 'No Suitable Vehicles',
      noVehiclesDesc: 'Your selection of {persons} passengers and {luggage} bags exceeds the capacity of our available fleet.',
      adjust: 'Adjust Requirements', miles: 'Miles',
      footerNote: 'TransferLane operates a fleet of licensed, professionally maintained vehicles. Every {miles} mile journey is monitored 24/7 by our operations centre.'
    },
    [Language.ES]: {
      back: 'Volver a la búsqueda', badge: 'Ruta Confirmada', title: 'Su Viaje Personalizado',
      dist: 'Distancia', time: 'Tiempo Est.', collection: 'Recogida', destination: 'Destino',
      priceNote: 'Su precio es fijo y todo incluido. Incluye la ruta de {miles} millas, peajes de autopista del Reino Unido y 15 minutos de espera de cortesía.',
      chooseVehicle: 'Elija Su Vehículo', bigCarInfo: 'Mostrando vehículos más grandes para su grupo y equipaje.',
      passengers: 'Pasajeros', items: 'Artículos', fixedQuote: 'Presupuesto Fijo', base: 'Base', mile: 'Milla',
      seats: 'Asientos', bags: 'Maletas', eliteDriver: 'Conductor Élite', available: 'Disponible Ahora',
      confirm: 'Confirmar Elección', select: 'Seleccionar Vehículo', noVehicles: 'No Hay Vehículos Adecuados',
      noVehiclesDesc: 'Su selección de {persons} pasajeros y {luggage} maletas excede la capacidad de nuestra flota disponible.',
      adjust: 'Ajustar Requisitos', miles: 'Millas',
      footerNote: 'TransferLane opera una flota de vehículos autorizados y mantenidos profesionalmente. Cada viaje de {miles} millas es monitoreado 24/7 por nuestro centro de operaciones.'
    },
    [Language.FR]: {
      back: 'Retour à la recherche', badge: 'Itinéraire Confirmé', title: 'Votre Voyage Sur Mesure',
      dist: 'Distance', time: 'Temps Est.', collection: 'Prise en charge', destination: 'Destination',
      priceNote: 'Votre prix est fixe et tout compris. Il comprend l\'itinéraire de {miles} miles, les péages d\'autoroute du Royaume-Uni et 15 minutes de temps d\'attente gratuit.',
      chooseVehicle: 'Choisissez Votre Voiture', bigCarInfo: 'Affichage de voitures plus grandes pour votre groupe et vos bagages.',
      passengers: 'Passagers', items: 'Articles', fixedQuote: 'Devis Fixe', base: 'Base', mile: 'Mile',
      seats: 'Sièges', bags: 'Bagages', eliteDriver: 'Chauffeur Élite', available: 'Disponible',
      confirm: 'Confirmer', select: 'Sélectionner', noVehicles: 'Aucun Véhicule Adapté',
      noVehiclesDesc: 'Votre sélection de {persons} passagers et {luggage} bagages dépasse la capacité de notre flotte disponible.',
      adjust: 'Ajuster', miles: 'Miles',
      footerNote: 'TransferLane exploite une flotte de véhicules agréés et entretenus professionnellement. Chaque trajet de {miles} miles est surveillé 24h/24 et 7j/7 par notre centre d\'opérations.'
    },
    [Language.DE]: {
      back: 'Zur Suche', badge: 'Route Bestätigt', title: 'Ihre Reise',
      dist: 'Entfernung', time: 'Zeit Est.', collection: 'Abholung', destination: 'Ziel',
      priceNote: 'Ihr Preis ist fest und All-inclusive. Beinhaltet die {miles}-Meilen-Route, UK-Mautgebühren und 15 Min. Wartezeit.',
      chooseVehicle: 'Wählen Sie Ihr Auto', bigCarInfo: 'Größere Autos für Ihre Gruppe.',
      passengers: 'Passagiere', items: 'Artikel', fixedQuote: 'Festpreis', base: 'Basis', mile: 'Meile',
      seats: 'Sitze', bags: 'Gepäck', eliteDriver: 'Elite-Fahrer', available: 'Verfügbar',
      confirm: 'Bestätigen', select: 'Wählen', noVehicles: 'Keine Fahrzeuge',
      noVehiclesDesc: '{persons} Passagiere und {luggage} Gepäckstücke übersteigen unsere Kapazität.',
      adjust: 'Anpassen', miles: 'Meilen',
      footerNote: 'TransferLane betreibt lizenzierte Fahrzeuge. Jede {miles}-Meilen-Fahrt wird 24/7 überwacht.'
    },
  } as const;

  const t = translations[language];

  const journeyMetrics = useMemo(() => {
    const seed = (rideData.pickup.length + rideData.dropoff.length);
    const miles = Math.floor((seed * 1.8) + 20);
    const speedAverage = 55;
    const hours = Math.floor(miles / speedAverage);
    const mins = Math.floor(((miles % speedAverage) / speedAverage) * 60);
    
    return {
      distance: miles,
      duration: `${hours > 0 ? hours + 'h ' : ''}${mins}m`,
      miles: miles
    };
  }, [rideData]);

  // Full vehicle catalog with group models strictly at the end
  const vehicles = useMemo(
    () => [
    {
      id: 'saloon',
      name: 'Saloon Experience',
      model: 'Tesla Model S',
      baseFare: 40,
      ratePerMile: 2.10,
      seats: 3,
      bags: 2,
      img: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?q=85&w=1600&auto=format&fit=crop',
      tag: 'Eco-Refined',
      desc: 'Silent, sustainable, and perfect for city-to-city transfers.'
    },
    {
      id: 'suv',
      name: 'SUV Excellence',
      model: 'Mitsubishi Outlander',
      baseFare: 60,
      ratePerMile: 2.75,
      seats: 4,
      bags: 4,
      img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=85&w=1600&auto=format&fit=crop',
      tag: 'Family Favorite',
      desc: 'Spacious and commanding. Ideal for families with luggage.'
    },
    {
      id: 'elite',
      name: 'Elite Class',
      model: 'Mercedes-Benz S-Class',
      baseFare: 85,
      ratePerMile: 3.40,
      seats: 3,
      bags: 3,
      img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=85&w=1600&auto=format&fit=crop',
      tag: 'Executive Choice',
      desc: 'The global benchmark in premium chauffeur travel.'
    },
    {
      id: 'royale',
      name: 'First Class Royale',
      model: 'Rolls-Royce Phantom',
      baseFare: 220,
      ratePerMile: 6.50,
      seats: 3,
      bags: 2,
      img: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=85&w=1600&auto=format&fit=crop',
      tag: 'Prestige Elite',
      desc: 'The ultimate statement in British cinematic luxury.'
    },
    {
      id: 'luxury_mpv',
      name: 'Executive MPV',
      model: 'Mercedes-Benz V-Class',
      baseFare: 75,
      ratePerMile: 3.20,
      seats: 7,
      bags: 6,
      img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=85&w=1600&auto=format&fit=crop',
      tag: '7-Seater Luxury',
      desc: 'Sophisticated group travel with conference seating and leather upholstery.',
      isBigCar: true
    },
    {
      id: 'group_elite',
      name: 'Elite Group Travel',
      model: 'Mercedes-Benz Vito Tourer',
      baseFare: 90,
      ratePerMile: 3.50,
      seats: 8,
      bags: 8,
      img: 'https://images.unsplash.com/photo-1621285853634-713b8dd6b5ee?q=85&w=1600&auto=format&fit=crop',
      tag: '8-Seater Prestige',
      desc: 'Generous proportions and first-class safety for up to 8 passengers.',
      isBigCar: true
    }
    ],
    [],
  );

  // Specific logic: > 4 passengers or > 4 bags triggers "Bigger Car" only view
  const availableVehicles = useMemo(() => {
    const needsBigCar = rideData.persons > 4 || rideData.luggage > 4;
    
    if (needsBigCar) {
      // Return only the group models (7 & 8 seaters)
      return vehicles.filter(v => v.isBigCar && v.seats >= rideData.persons && v.bags >= rideData.luggage);
    }
    
    // Default filtering based on capacity, showing all eligible vehicles
    return vehicles.filter(v => v.seats >= rideData.persons && v.bags >= rideData.luggage);
  }, [rideData, vehicles]);

  const mapUrl = `https://www.google.com/maps?output=embed&saddr=${encodeURIComponent(rideData.pickup)}&daddr=${encodeURIComponent(rideData.dropoff)}`;

  const calculateQuote = (base: number, rate: number) => {
    return (base + (rate * journeyMetrics.distance)).toFixed(2);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white dark:bg-background-dark overflow-hidden">
      {/* Sidebar: Journey Information */}
      <aside className="w-full lg:w-[460px] flex flex-col border-r border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-surface-dark shadow-2xl z-20">
        <div className="p-10 overflow-y-auto flex-grow custom-scrollbar">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary mb-12 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span> {t.back}
          </button>
          
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-sm">route</span> {t.badge}
            </div>
            <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
              {t.title.split(' ').slice(0, -1).join(' ')} <br/>
              <span className="italic font-display text-primary">{t.title.split(' ').slice(-1)}</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-6 bg-white dark:bg-white/5 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.dist}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-display">
                {journeyMetrics.distance} <span className="text-xs text-primary font-sans uppercase">{t.miles}</span>
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-white/5 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.time}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{journeyMetrics.duration}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">my_location</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.collection}</p>
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-500">location_on</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.destination}</p>
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.dropoff}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10 flex items-start gap-4">
             <span className="material-symbols-outlined text-primary text-xl">verified</span>
             <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
               {t.priceNote.replace('{miles}', journeyMetrics.distance.toString())}
             </p>
          </div>
        </div>

        <div className="h-[300px] w-full relative">
          <iframe
            title="Journey Route Preview"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={mapUrl}
            className="grayscale-[0.1] contrast-[1.1] brightness-[0.9]"
          ></iframe>
          <div className="absolute inset-0 pointer-events-none border-t border-gray-200 dark:border-white/5 shadow-[inset_0_20px_20px_-20px_rgba(0,0,0,0.1)]"></div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-background-dark p-8 lg:p-16 custom-scrollbar">
        <div className="w-full">
          <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{t.chooseVehicle}</h2>
              {(rideData.persons > 4 || rideData.luggage > 4) && (
                <div className="mt-3 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <p className="text-xs font-black uppercase tracking-widest">{t.bigCarInfo}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl">
                <span className="material-symbols-outlined text-primary">group</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{rideData.persons} {t.passengers}</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl">
                <span className="material-symbols-outlined text-primary">luggage</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{rideData.luggage} {t.items}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8">
            {availableVehicles.length > 0 ? (
              availableVehicles.map((v) => {
                const totalPrice = calculateQuote(v.baseFare, v.ratePerMile);
                return (
                  <div 
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`group relative flex flex-col md:flex-row bg-white dark:bg-surface-dark rounded-[48px] overflow-hidden border cursor-pointer transition-all duration-700 hover:shadow-4xl active:scale-[0.99] shadow-xl ${
                      selectedId === v.id 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]' 
                        : 'border-gray-100 dark:border-white/5 hover:border-primary/40'
                    }`}
                  >
                    <div className="w-full md:w-[400px] h-72 md:h-auto overflow-hidden relative bg-slate-900">
                      <img src={v.img} alt={v.model} className="block w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute top-8 left-8 bg-primary/95 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-xl">
                        {v.tag}
                      </div>
                    </div>

                    <div className="flex-1 p-10 lg:p-14 flex flex-col">
                      <div className="flex flex-col xl:flex-row justify-between items-start gap-6 mb-8">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">{v.name}</p>
                          <h3 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white mb-4">{v.model}</h3>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-200 leading-relaxed max-w-md">
                            {v.desc}
                          </p>
                        </div>
                        <div className="xl:text-right shrink-0 bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 min-w-[200px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.fixedQuote}</p>
                          <p className="text-5xl font-black text-primary font-display tracking-tighter">£{totalPrice}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-200 mt-2 tracking-widest uppercase">
                            £{v.baseFare} {t.base} • £{v.ratePerMile.toFixed(2)} / {t.mile}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-10">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-gray-100 dark:border-white/5">
                          <span className="material-symbols-outlined text-primary text-xl">airline_seat_recline_normal</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{v.seats} {t.seats}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-gray-100 dark:border-white/5">
                          <span className="material-symbols-outlined text-primary text-xl">luggage</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{v.bags} {t.bags}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-gray-100 dark:border-white/5">
                          <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.eliteDriver}</span>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-6 border-t border-gray-100 dark:border-white/5 pt-8">
                        <div className="flex items-center gap-2 text-green-600">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          <p className="text-[10px] font-black uppercase tracking-widest">{t.available}</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onSelect({...v, price: `£${totalPrice}`, miles: journeyMetrics.distance}); 
                          }}
                          className={`px-12 py-5 font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 ${
                            selectedId === v.id 
                              ? 'bg-primary text-white shadow-primary/40' 
                              : 'bg-slate-900 dark:bg-primary/80 text-white'
                          }`}
                        >
                          {selectedId === v.id ? t.confirm : t.select}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-20 text-center bg-white dark:bg-surface-dark rounded-[48px] border-2 border-dashed border-gray-200 dark:border-white/10">
                <span className="material-symbols-outlined text-6xl text-primary mb-6">info</span>
                <h3 className="text-2xl font-black mb-4">{t.noVehicles}</h3>
                <p className="text-text-muted dark:text-slate-200 max-w-sm mx-auto">
                  {t.noVehiclesDesc.replace('{persons}', rideData.persons.toString()).replace('{luggage}', rideData.luggage.toString())}
                </p>
                <button onClick={onBack} className="mt-10 px-10 py-4 bg-primary text-white font-black rounded-xl">{t.adjust}</button>
              </div>
            )}
          </div>
          
          <footer className="mt-20 text-center border-t border-gray-200 dark:border-white/5 pt-16 mb-20">
            <p className="text-slate-400 dark:text-slate-200 text-[10px] font-black leading-relaxed max-w-2xl mx-auto uppercase tracking-[0.3em]">
              {t.footerNote.replace('{miles}', journeyMetrics.distance.toString())}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default VehicleSelection;
