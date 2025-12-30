
import React, { useState, useMemo } from 'react';
import { RideData, Language } from '../types';

interface VehicleSelectionProps {
  rideData: RideData;
  onSelect: (vehicle: any) => void;
  onBack: () => void;
  language: Language;
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({ rideData, onSelect, onBack, language }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const translations = {
    [Language.EN]: {
      back: 'Return to Search', badge: 'Route Confirmed', title: 'Your Custom Journey',
      dist: 'Distance', time: 'Est. Time', pricing: 'Transparent Pricing', base: 'Base',
      rate: 'Rate', total: 'Total', select: 'Select Vehicle', confirm: 'Confirm',
      miles: 'Miles', note: 'Fares are calculated as Base Fare + (Distance × Rate per Mile).'
    },
    [Language.ES]: {
      back: 'Volver a buscar', badge: 'Ruta Confirmada', title: 'Tu Viaje Personalizado',
      dist: 'Distancia', time: 'Tiempo Est.', pricing: 'Precio Transparente', base: 'Base',
      rate: 'Tarifa', total: 'Total', select: 'Seleccionar Vehículo', confirm: 'Confirmar',
      miles: 'Millas', note: 'Las tarifas se calculan como Tarifa Base + (Distancia × Tarifa por milla).'
    },
    [Language.DE]: {
      back: 'Zurück zur Suche', badge: 'Route Bestätigt', title: 'Ihre Maßgeschneiderte Reise',
      dist: 'Entfernung', time: 'Vorauss. Zeit', pricing: 'Transparente Preise', base: 'Basis',
      rate: 'Rate', total: 'Gesamt', select: 'Fahrzeug wählen', confirm: 'Bestätigen',
      miles: 'Meilen', note: 'Fahrpreise werden berechnet als Grundgebühr + (Entfernung × Rate pro Meile).'
    },
    [Language.FR]: {
      back: 'Retour à la recherche', badge: 'Itinéraire Confirmé', title: 'Votre Voyage sur Mesure',
      dist: 'Distance', time: 'Temps Est.', pricing: 'Prix Transparent', base: 'Base',
      rate: 'Tarif', total: 'Total', select: 'Choisir le véhicule', confirm: 'Confirmer',
      miles: 'Miles', note: 'Les tarifs sont calculés comme Tarif de Base + (Distance × Tarif par mile).'
    }
  };

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

  const vehicles = [
    {
      id: 'saloon',
      name: 'Saloon Experience',
      model: 'Tesla Model S',
      baseFare: 40,
      ratePerMile: 2.10,
      seats: 3,
      bags: 2,
      img: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?q=85&w=1600&auto=format&fit=crop',
      desc: 'Silent, sustainable transfers.'
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
      desc: 'Spacious and commanding.'
    },
    {
      id: 'vclass',
      name: 'V-Class Executive',
      model: 'Mercedes-Benz V-Class',
      baseFare: 80,
      ratePerMile: 3.20,
      seats: 7,
      bags: 6,
      img: 'https://images.unsplash.com/photo-1601362840469-51e4d8d59085?q=85&w=1600&auto=format&fit=crop',
      desc: '7-seater luxury arrangement.'
    },
    {
      id: 'vito',
      name: 'Vito Executive',
      model: 'Mercedes-Benz Vito Tourer',
      baseFare: 90,
      ratePerMile: 3.50,
      seats: 8,
      bags: 8,
      img: 'https://images.unsplash.com/photo-1549411223-398244d6935c?q=85&w=1600&auto=format&fit=crop',
      desc: '8-seater maximum capacity.'
    }
  ];

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.seats >= rideData.persons);
  }, [rideData]);

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapUrl = mapsKey
    ? `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${encodeURIComponent(rideData.pickup)}&destination=${encodeURIComponent(rideData.dropoff)}&mode=driving&zoom=10`
    : `https://www.google.com/maps?saddr=${encodeURIComponent(rideData.pickup)}&daddr=${encodeURIComponent(rideData.dropoff)}&output=embed`;

  const calculateQuote = (base: number, rate: number) => {
    return (base + (rate * journeyMetrics.distance)).toFixed(2);
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-screen bg-white dark:bg-background-dark overflow-hidden relative">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-background-dark border-b border-slate-100 dark:border-white/10 z-40 sticky top-0 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white flex items-center">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div className="flex-1 px-4 truncate text-center">
          <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mb-0.5">{t.badge}</p>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{rideData.pickup} → {rideData.dropoff}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <aside className="w-full lg:w-[460px] flex flex-col border-r border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-surface-dark shadow-2xl z-20 overflow-y-auto order-2 lg:order-1 flex-grow">
        <div className="p-5 md:p-8 lg:p-10 flex-grow pb-24 lg:pb-10">
          <button onClick={onBack} className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-primary mb-10 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span> {t.back}
          </button>
          
          <div className="mb-6 md:mb-8">
            <div className="inline-flex lg:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-sm">route</span> {t.badge}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[0.95] tracking-tighter text-slate-900 dark:text-white">
              {t.title.split(' ').slice(0, 2).join(' ')} <br/>
              <span className="italic font-display text-primary">{t.title.split(' ').slice(2).join(' ')}</span>
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="p-3 md:p-4 bg-white dark:bg-white/5 rounded-2xl md:rounded-[24px] border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.dist}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display">
                {journeyMetrics.distance} <span className="text-[10px] text-primary font-sans uppercase">{t.miles}</span>
              </p>
            </div>
            <div className="p-3 md:p-4 bg-white dark:bg-white/5 rounded-2xl md:rounded-[24px] border border-gray-200 dark:border-white/10 shadow-sm">
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.time}</p>
              <p className="text-base md:text-lg font-black text-slate-900 dark:text-white mt-0.5">{journeyMetrics.duration}</p>
            </div>
          </div>

          {/* Pricing Detail Card - Slightly more compact on mobile */}
          <div className="mb-6 md:mb-8 p-4 md:p-5 rounded-2xl md:rounded-[24px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.pricing}</p>
            </div>
            <div className="flex items-center justify-between text-center gap-0.5 md:gap-1">
              <div className="flex-1"><p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">£{selectedVehicle?.baseFare || '--'}</p><p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">{t.base}</p></div>
              <div className="text-primary font-bold text-[10px]">+</div>
              <div className="flex-1"><p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{journeyMetrics.distance}</p><p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">{t.miles}</p></div>
              <div className="text-primary font-bold text-[10px]">×</div>
              <div className="flex-1"><p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">£{selectedVehicle?.ratePerMile.toFixed(2) || '--'}</p><p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">{t.rate}</p></div>
              <div className="text-primary font-bold text-[10px]">=</div>
              <div className="flex-1"><p className="text-xs md:text-sm font-black text-primary">£{selectedVehicle ? calculateQuote(selectedVehicle.baseFare, selectedVehicle.ratePerMile) : '--'}</p><p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">{t.total}</p></div>
            </div>
          </div>

          <p className="text-[9px] md:text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mb-4">{t.select}</p>
          <div className="space-y-2 md:space-y-3 pb-6 md:pb-10">
            {availableVehicles.map((v) => (
              <button key={v.id} onClick={() => setSelectedId(v.id)} className={`w-full text-left p-3 md:p-4 rounded-2xl md:rounded-[24px] border-2 transition-all ${selectedId === v.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-primary/30'}`}>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="size-12 md:size-16 rounded-xl overflow-hidden shrink-0 shadow-md border border-slate-100 dark:border-white/5"><img src={v.img} alt={v.model} className="w-full h-full object-cover" /></div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-black text-slate-900 dark:text-white truncate text-xs md:text-sm">{v.model}</h3>
                      <p className="font-black text-primary ml-2 text-xs md:text-sm">£{calculateQuote(v.baseFare, v.ratePerMile)}</p>
                    </div>
                    <p className="text-[8px] md:text-[9px] text-text-muted font-medium line-clamp-1">{v.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Floating Bottom Button for Mobile */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-slate-100 dark:border-white/5 z-50 lg:hidden">
          <button 
            disabled={!selectedId}
            onClick={() => onSelect({...selectedVehicle, miles: journeyMetrics.distance, price: `£${calculateQuote(selectedVehicle!.baseFare, selectedVehicle!.ratePerMile)}`})}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
          >
            {t.confirm} {selectedVehicle?.model || ''}
          </button>
        </div>

        {/* Desktop Sticky Button Area */}
        <div className="hidden lg:block p-10 pt-0 sticky bottom-0 z-10 bg-slate-50 dark:bg-surface-dark">
          <button 
            disabled={!selectedId}
            onClick={() => onSelect({...selectedVehicle, miles: journeyMetrics.distance, price: `£${calculateQuote(selectedVehicle!.baseFare, selectedVehicle!.ratePerMile)}`})}
            className="w-full py-5 bg-primary text-white font-black rounded-[20px] shadow-3xl shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {t.confirm} {selectedVehicle?.model || ''}
          </button>
        </div>
      </aside>

      <main className="w-full lg:flex-1 relative bg-slate-900 order-1 lg:order-2 h-[35vh] sm:h-[40vh] lg:h-full">
        <iframe title="Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={mapUrl} className="grayscale-[0.2] contrast-[1.1]" />
      </main>
    </div>
  );
};

export default VehicleSelection;
