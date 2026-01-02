/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useEffect, useState } from 'react';
import { RideData, SelectedVehicle } from './types';
import { DestinationHighlight, getDestinationHighlight, getRouteMapLink } from './services/client';
import { useLanguage, Language } from '../../lib/language';

interface RideCompletedProps {
  rideData: RideData;
  selectedVehicle?: SelectedVehicle | null;
  onBack: () => void;
}

const RideCompleted: React.FC<RideCompletedProps> = ({ rideData, selectedVehicle, onBack }) => {
  const { language } = useLanguage();
  const [mapLink, setMapLink] = useState<string>('');
  const [highlight, setHighlight] = useState<DestinationHighlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pickupDateTimeText = (() => {
    try {
      const d = new Date(`${rideData.date}T${rideData.time}:00`);
      if (Number.isNaN(d.getTime())) return `${rideData.date} ${rideData.time}`.trim();
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return `${rideData.date} ${rideData.time}`.trim();
    }
  })();

  const translations = {
    [Language.EN]: {
      confirmed: 'Booking Confirmed!',
      dispatched: 'Your chauffeur has been dispatched. They will arrive at {pickup} on {date} for your {miles} mile journey to {dropoff}.',
      dashboard: 'Return to Dashboard', receipt: 'Share Receipt', back: 'Return to Selection',
      badge: 'Final Review', title: 'Secure Your Seat.', chosen: 'Vehicle Chosen',
      driverName: 'Marcus Sterling', driverSub: 'Senior Chauffeur • 4.9/5 Rating',
      amenities: 'Amenities Provided', fare: 'Total Fixed Fare', book: 'Secure Booking',
      pickupLabel: 'Pickup Location', destLabel: 'Destination', processing: 'Processing...',
      miles: 'Miles Total', arrivalTitle: 'Journey Confirmed', crafting: 'Crafting your arrival...',
      securing: 'Securing regional insights for {dest}', destPreview: 'Elite Destination Preview',
      localGuide: 'Local Concierge Guide', liveUpdates: 'Live Updates',
      routeReady: 'Route Ready.', routeReadySub: 'While we couldn\'t fetch a visual spotlight, your professional chauffeur is prepared for the {miles} mile journey to {dest}.',
      reviewMap: 'Review Full Route Map', viewMap: 'View Journey Map'
    },
    [Language.ES]: {
      confirmed: '\u00a1Reserva Confirmada!',
      dispatched: 'Su ch\u00f3fer ha sido asignado. Llegar\u00e1 a {pickup} el {date} para su viaje de {miles} millas a {dropoff}.',
      dashboard: 'Volver al Panel', receipt: 'Compartir Recibo', back: 'Volver a la selecci\u00f3n',
      badge: 'Revisi\u00f3n Final', title: 'Asegure su asiento.', chosen: 'Veh\u00edculo elegido',
      driverName: 'Marcos Sterling', driverSub: 'Ch\u00f3fer Senior \u2022 4.9/5',
      amenities: 'Servicios incluidos', fare: 'Tarifa Fija Total', book: 'Confirmar Reserva',
      pickupLabel: 'Recogida', destLabel: 'Destino', processing: 'Procesando...',
      miles: 'Millas en total', arrivalTitle: 'Viaje Confirmado', crafting: 'Preparando su llegada...',
      securing: 'Obteniendo datos de {dest}', destPreview: 'Vista Previa del Destino',
      localGuide: 'Gu\u00eda Local', liveUpdates: 'Actualizaciones',
      routeReady: 'Ruta Lista.', routeReadySub: 'Su ch\u00f3fer profesional est\u00e1 preparado para el viaje de {miles} millas a {dest}.',
      reviewMap: 'Ver Mapa Completo', viewMap: 'Ver Mapa de Viaje'
    },
    [Language.FR]: {
      confirmed: 'R\u00e9servation Confirm\u00e9e !',
      dispatched: 'Votre chauffeur a \u00e9t\u00e9 d\u00e9p\u00each\u00e9. Il arrivera \u00e0 {pickup} le {date} pour votre trajet de {miles} miles vers {dropoff}.',
      dashboard: 'Retour au tableau de bord', receipt: 'Partager le re\u00e7u', back: 'Retour \u00e0 la s\u00e9lection',
      badge: 'Derni\u00e8re \u00e9tape', title: 'S\u00e9curisez votre place.', chosen: 'V\u00e9hicule choisi',
      driverName: 'Marcus Sterling', driverSub: 'Chauffeur Senior \u2022 4,9/5',
      amenities: 'Services \u00e0 bord', fare: 'Tarif fixe total', book: 'R\u00e9server',
      pickupLabel: 'D\u00e9part', destLabel: 'Destination', processing: 'Traitement...',
      miles: 'Miles au total', arrivalTitle: 'Voyage Confirm\u00e9', crafting: 'Pr\u00e9paration de votre arriv\u00e9e...',
      securing: 'R\u00e9cup\u00e9ration des donn\u00e9es pour {dest}', destPreview: 'Aper\u00e7u de Destination',
      localGuide: 'Guide Local', liveUpdates: 'Mises \u00e0 jour',
      routeReady: 'Itin\u00e9raire Pr\u00eat.', routeReadySub: 'Votre chauffeur est pr\u00e9par\u00e9 pour le trajet de {miles} miles vers {dest}.',
      reviewMap: 'Voir Carte Compl\u00e8te', viewMap: 'Voir Carte'
    },
    [Language.DE]: {
      confirmed: 'Buchung Best\u00e4tigt!',
      dispatched: 'Ihr Chauffeur wurde entsandt. Er wird am {date} um {pickup} f\u00fcr Ihre {miles}-Meilen-Reise nach {dropoff} eintreffen.',
      dashboard: 'Zum Dashboard', receipt: 'Quittung teilen', back: 'Zur\u00fcck',
      badge: 'Letzte Pr\u00fcfung', title: 'Platz sichern.', chosen: 'Gew\u00e4hltes Auto',
      driverName: 'Marcus Sterling', driverSub: 'Senior-Chauffeur \u2022 4,9/5',
      amenities: 'Extras', fare: 'Gesamtpreis', book: 'Buchen',
      pickupLabel: 'Abholung', destLabel: 'Zielort', processing: 'Wird bearbeitet...',
      miles: 'Meilen', arrivalTitle: 'Reise Best\u00e4tigt', crafting: 'Ihre Ankunft wird vorbereitet...',
      securing: 'Daten f\u00fcr {dest} abrufen', destPreview: 'Zielvorschau',
      localGuide: 'Lokaler Guide', liveUpdates: 'Live-Updates',
      routeReady: 'Route Bereit.', routeReadySub: 'Ihr Chauffeur ist f\u00fcr die {miles}-Meilen-Fahrt nach {dest} bereit.',
      reviewMap: 'Vollst\u00e4ndige Karte', viewMap: 'Karte anzeigen'
    },
  } as const;

  const t = translations[language];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [link, spot] = await Promise.all([
          getRouteMapLink(rideData.pickup, rideData.dropoff),
          getDestinationHighlight(rideData.dropoff)
        ]);
        setMapLink(link);
        setHighlight(spot);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rideData]);

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setBookingConfirmed(true);
  };

  if (bookingConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100svh] bg-white dark:bg-background-dark px-4 py-10 sm:p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-20 sm:size-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 sm:mb-8 shadow-2xl shadow-green-500/30">
          <span className="material-symbols-outlined text-5xl">check_circle</span>
        </div>
        <h2 className={`font-black mb-3 sm:mb-4 tracking-tighter ${language === Language.DE ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'}`}>{t.confirmed}</h2>
        <p className="text-text-muted dark:text-slate-200 text-base sm:text-xl max-w-lg mx-auto mb-8 sm:mb-10 font-medium">
          {t.dispatched
            .replace('{pickup}', rideData.pickup)
            .replace('{date}', pickupDateTimeText)
            .replace('{miles}', selectedVehicle?.miles?.toString() || 'point-to-point')
            .replace('{dropoff}', rideData.dropoff)}
        </p>
        <div className="flex w-full max-w-lg flex-col sm:flex-row gap-3 sm:gap-4">
          <button onClick={() => window.location.reload()} className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 sm:hover:scale-105 transition-transform">
            {t.dashboard}
          </button>
          <button className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-black rounded-2xl hover:bg-gray-50 transition-colors">
            {t.receipt}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[100svh] overflow-hidden bg-background-light dark:bg-background-dark">
      <aside className="w-full lg:w-[440px] bg-white dark:bg-surface-dark px-4 py-6 sm:p-10 border-r border-white/5 flex flex-col overflow-y-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-text-muted dark:text-slate-200 hover:text-primary mb-8 sm:mb-12 text-xs font-black uppercase tracking-widest transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> {t.back}
        </button>
        
        <div className="mb-8 sm:mb-10">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-[0.2em] border border-primary/20">{t.badge}</span>
          <h1 className={`font-black mt-4 leading-tight tracking-tighter ${language === Language.DE ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'}`}>{t.title.split(' ').slice(0, -1).join(' ')} <br/>{t.title.split(' ').slice(-1)}</h1>
        </div>

        <div className="space-y-8 mb-10">
          {selectedVehicle && (
            <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/20 shadow-sm relative overflow-hidden group">
               <div className="relative z-10 flex items-center gap-6">
                  <div className="size-20 rounded-[20px] overflow-hidden shadow-xl shrink-0">
                    <img src={selectedVehicle.img} alt={selectedVehicle.model} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t.chosen}</p>
                     <h3 className="font-black text-xl text-slate-900 dark:text-white">{selectedVehicle.model}</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{selectedVehicle.miles} {t.miles}</p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-7xl">local_taxi</span>
               </div>
            </div>
          )}

           <div className="bg-gray-50 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-4 sm:gap-6 mb-6">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200" className="size-20 rounded-full border-2 border-primary object-cover shadow-xl" alt="Driver" />
                  <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full shadow-lg"></div>
                </div>
                <div>
                 <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">{t.driverName}</h3>
                   <p className="text-xs text-text-muted dark:text-slate-200 font-bold tracking-wide mt-1">{t.driverSub}</p>
                </div>
             </div>
             <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                 <p className="text-[10px] font-black text-text-muted dark:text-slate-200 uppercase mb-4 tracking-widest">{t.amenities}</p>
                <div className="flex flex-wrap gap-2">
                   <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-full text-[10px] font-bold border border-gray-100 dark:border-white/5 flex items-center gap-2">
                     <span className="material-symbols-outlined text-sm text-primary">water_drop</span> Evian Water
                   </span>
                   <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-full text-[10px] font-bold border border-gray-100 dark:border-white/5 flex items-center gap-2">
                     <span className="material-symbols-outlined text-sm text-primary">wifi</span> High-Speed WiFi
                   </span>
                </div>
             </div>
          </div>

          <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 dark:before:bg-white/5">
            <div className="relative">
              <span className="absolute -left-[1.625rem] top-1/2 -translate-y-1/2 size-4 bg-primary rounded-full ring-8 ring-primary/10"></span>
              <p className="text-[10px] font-black text-text-muted dark:text-slate-200 uppercase tracking-widest mb-1">{t.pickupLabel}</p>
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.pickup}</p>
            </div>

            {rideData.stops?.map((stop, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[1.625rem] top-1/2 -translate-y-1/2 size-4 bg-slate-400 rounded-full ring-8 ring-slate-400/10"></span>
                <p className="text-[10px] font-black text-text-muted dark:text-slate-200 uppercase tracking-widest mb-1">Stop {idx + 1}</p>
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{stop}</p>
              </div>
            ))}

            <div className="relative">
              <span className="absolute -left-[1.625rem] top-1/2 -translate-y-1/2 size-4 bg-blue-500 rounded-full ring-8 ring-blue-500/10"></span>
              <p className="text-[10px] font-black text-text-muted dark:text-slate-200 uppercase tracking-widest mb-1">{t.destLabel}</p>
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.dropoff}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-text-muted dark:text-slate-200 uppercase tracking-widest mb-1">{t.fare}</p>
              <p className="text-4xl font-black text-primary font-display">{selectedVehicle?.price || '£140.00'}</p>
            </div>
            <div className="text-right">
              <span className="material-symbols-outlined text-green-500 text-3xl">verified</span>
            </div>
          </div>
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className={`group w-full py-5 sm:py-6 bg-primary text-white font-black rounded-[24px] shadow-3xl shadow-primary/30 transition-all hover:bg-primary-dark sm:hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest ${language === Language.DE ? 'text-xs' : 'text-sm'}`}
          >
            {isProcessing ? (
               <span className="animate-spin material-symbols-outlined">sync</span>
            ) : (
              <>
                <span>{t.book}</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">lock</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 dark:bg-black relative overflow-hidden min-h-[50svh]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark z-20">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8"></div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight animate-pulse text-slate-900 dark:text-white font-display">{t.crafting}</h2>
            <p className="text-text-muted dark:text-slate-200 text-sm mt-2 font-medium px-6 text-center">{t.securing.replace('{dest}', rideData.dropoff)}</p>
          </div>
        ) : highlight ? (
          <div className="h-full w-full relative animate-in fade-in duration-1000">
            <img 
              src={highlight.imageUrl} 
              alt={highlight.title} 
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            
            <div className="absolute top-4 right-4 sm:top-10 sm:right-10 z-10 flex gap-4">
               <a 
                href={mapLink} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/25 transition-all shadow-2xl"
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                {t.viewMap}
              </a>
            </div>

            <div className="absolute bottom-6 left-4 right-4 sm:bottom-16 sm:left-16 sm:right-auto max-w-2xl">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-8 shadow-2xl">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {t.destPreview}
              </div>
              <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-white font-display mb-6 sm:mb-8 leading-tight drop-shadow-2xl">
                {highlight.title}
              </h2>
              <p className="text-white/90 text-base sm:text-xl md:text-2xl font-medium leading-relaxed drop-shadow-lg mb-8 sm:mb-10 max-w-xl">
                {highlight.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <button className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white transition-all shadow-2xl">
                  {t.localGuide}
                </button>
                <button className="px-8 sm:px-10 py-4 sm:py-5 bg-white/10 border border-white/30 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/20 transition-all backdrop-blur-xl">
                  {t.liveUpdates}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-background-dark">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-2xl">
              <span className="material-symbols-outlined text-5xl">explore</span>
            </div>
            <h2 className="text-5xl font-black mb-6 text-white tracking-tighter">{t.routeReady}</h2>
            <p className="text-slate-200 text-xl mb-12 max-w-md mx-auto font-medium">
              {t.routeReadySub.replace('{miles}', selectedVehicle?.miles?.toString() || '').replace('{dest}', rideData.dropoff)}
            </p>
            <a href={mapLink} target="_blank" rel="noreferrer" className="px-12 py-6 bg-primary text-white font-black rounded-[24px] shadow-3xl shadow-primary/30 uppercase tracking-widest text-sm hover:scale-105 transition-transform">
              {t.reviewMap}
            </a>
          </div>
        )}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </main>
    </div>
  );
};

export default RideCompleted;