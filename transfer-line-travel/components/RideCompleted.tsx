
import React, { useState } from 'react';
import { RideData, Language } from '../types';

interface RideCompletedProps {
  rideData: RideData;
  selectedVehicle?: any;
  onBack: () => void;
  language: Language;
}

const RideCompleted: React.FC<RideCompletedProps> = ({ rideData, selectedVehicle, onBack, language }) => {
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const translations = {
    [Language.EN]: {
      confirmed: 'Booking Confirmed!',
      dispatched: `Your chauffeur has been dispatched. They will arrive at ${rideData.pickup} on ${rideData.date} at ${rideData.pickupTime} for your journey to ${rideData.dropoff}.`,
      dashboard: 'Return to Dashboard',
      receipt: 'Share Receipt',
      back: 'Return to Selection',
      badge: 'Final Review',
      title: 'Secure Your Seat.',
      chosen: 'Vehicle Chosen',
      driverName: 'Marcus Sterling',
      driverSub: 'Senior Chauffeur • 4.9/5 Rating',
      amenities: 'Amenities Provided',
      fare: 'Total Fixed Fare',
      book: 'Secure Booking',
      pickupLabel: 'Pickup at',
      destLabel: 'Destination',
      processing: 'Processing...',
      miles: 'Miles Total',
      arrivalTitle: 'Journey Confirmed'
    },
    [Language.ES]: {
      confirmed: '¡Reserva Confirmada!',
      dispatched: `Su chófer ha sido asignado. Llegará a ${rideData.pickup} el ${rideData.date} a las ${rideData.pickupTime} para su viaje a ${rideData.dropoff}.`,
      dashboard: 'Volver al Panel',
      receipt: 'Compartir Recibo',
      back: 'Volver a la selección',
      badge: 'Revisión Final',
      title: 'Asegure su asiento.',
      chosen: 'Vehículo elegido',
      driverName: 'Marcos Sterling',
      driverSub: 'Chófer Senior • 4.9/5 Puntuación',
      amenities: 'Servicios incluidos',
      fare: 'Tarifa Fija Total',
      book: 'Confirmar Reserva',
      pickupLabel: 'Recogida a las',
      destLabel: 'Destino',
      processing: 'Procesando...',
      miles: 'Millas en total',
      arrivalTitle: 'Viaje Confirmado'
    },
    [Language.DE]: {
      confirmed: 'Buchung bestätigt!',
      dispatched: `Ihr Chauffeur wurde entsandt. Er wird am ${rideData.date} um ${rideData.pickupTime} in ${rideData.pickup} für Ihre Reise nach ${rideData.dropoff} eintreffen.`,
      dashboard: 'Zum Dashboard',
      receipt: 'Quittung teilen',
      back: 'Zurück zur Auswahl',
      badge: 'Letzte Prüfung',
      title: 'Platz sichern.',
      chosen: 'Gewähltes Fahrzeug',
      driverName: 'Marcus Sterling',
      driverSub: 'Senior-Chauffeur • 4,9/5 Bewertung',
      amenities: 'Inbegriffene Extras',
      fare: 'Gesamtpreis (Fix)',
      book: 'Sicher buchen',
      pickupLabel: 'Abholung um',
      destLabel: 'Zielort',
      processing: 'Wird bearbeitet...',
      miles: 'Meilen insgesamt',
      arrivalTitle: 'Reise Bestätigt'
    },
    [Language.FR]: {
      confirmed: 'Réservation Confirmée !',
      dispatched: `Votre chauffeur a été dépêché. Il arrivera à ${rideData.pickup} le ${rideData.date} à ${rideData.pickupTime} pour votre trajet vers ${rideData.dropoff}.`,
      dashboard: 'Retour au tableau de bord',
      receipt: 'Partager le reçu',
      back: 'Retour à la sélection',
      badge: 'Dernière étape',
      title: 'Sécurisez votre place.',
      chosen: 'Véhicule choisi',
      driverName: 'Marcus Sterling',
      driverSub: 'Chauffeur Senior • 4,9/5 Note',
      amenities: 'Services à bord',
      fare: 'Tarif fixe total',
      book: 'Réserver en sécurité',
      pickupLabel: 'Départ à',
      destLabel: 'Destination',
      processing: 'Traitement...',
      miles: 'Miles au total',
      arrivalTitle: 'Voyage Confirmé'
    }
  };

  const t = translations[language];

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setBookingConfirmed(true);
  };

  if (bookingConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white dark:bg-background-dark p-6 lg:p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-20 lg:size-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/30">
          <span className="material-symbols-outlined text-4xl lg:text-5xl">check_circle</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter">{t.confirmed}</h2>
        <p className="text-text-muted text-lg lg:text-xl max-w-lg mx-auto mb-10 font-medium leading-relaxed">
          {t.dispatched}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={() => window.location.reload()} className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-[10px]">
            {t.dashboard}
          </button>
          <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-black rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-[10px]">
            {t.receipt}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-full overflow-hidden bg-background-light dark:bg-background-dark">
      <aside className="w-full lg:w-[440px] bg-white dark:bg-surface-dark p-6 lg:p-10 border-r border-white/5 flex flex-col h-full overflow-y-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 lg:mb-12 text-[10px] font-black uppercase tracking-widest transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> {t.back}
        </button>
        
        <div className="mb-8 lg:mb-10 text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-[0.2em] border border-primary/20">{t.badge}</span>
          <h1 className="text-4xl lg:text-5xl font-black mt-4 leading-tight tracking-tighter">
            {t.title}
          </h1>
        </div>

        <div className="space-y-6 lg:space-y-8 mb-8 lg:mb-10 text-left">
          {selectedVehicle && (
            <div className="bg-primary/5 p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-primary/20 shadow-sm relative overflow-hidden">
               <div className="relative z-10 flex items-center gap-4 lg:gap-6">
                  <div className="size-16 lg:size-20 rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-xl border border-white/10 shrink-0">
                    <img src={selectedVehicle.img} alt={selectedVehicle.model} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{t.chosen}</p>
                     <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">{selectedVehicle.model}</h3>
                     <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{selectedVehicle.miles} {t.miles}</p>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-white/5 p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-4 lg:gap-6 mb-6">
                <div className="relative shrink-0">
                  <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200" className="size-16 lg:size-20 rounded-full border-2 border-primary object-cover shadow-xl" alt="Driver" />
                  <div className="absolute -bottom-1 -right-1 size-5 lg:size-6 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full shadow-lg"></div>
                </div>
                <div>
                   <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">{t.driverName}</h3>
                   <p className="text-[10px] text-text-muted font-bold tracking-wide mt-1">{t.driverSub}</p>
                </div>
             </div>
             <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                <p className="text-[9px] font-black text-text-muted uppercase mb-4 tracking-widest">{t.amenities}</p>
                <div className="flex flex-wrap gap-2">
                   <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-full text-[9px] font-bold border border-gray-100 dark:border-white/5 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[14px] text-primary">water_drop</span> Evian
                   </span>
                   <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-full text-[9px] font-bold border border-gray-100 dark:border-white/5 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[14px] text-primary">wifi</span> WiFi
                   </span>
                </div>
             </div>
          </div>

          <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 dark:before:bg-white/5">
            <div className="relative">
              <span className="absolute -left-[1.625rem] top-1/2 -translate-y-1/2 size-4 bg-primary rounded-full ring-8 ring-primary/10"></span>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{t.pickupLabel} {rideData.pickupTime}</p>
              <p className="text-xs lg:text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.pickup}</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[1.625rem] top-1/2 -translate-y-1/2 size-4 bg-blue-500 rounded-full ring-8 ring-blue-500/10"></span>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{t.destLabel}</p>
              <p className="text-xs lg:text-sm font-bold truncate text-slate-900 dark:text-white">{rideData.dropoff}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-gray-100 dark:border-white/5 space-y-6 text-left">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{t.fare}</p>
              <p className="text-3xl lg:text-4xl font-black text-primary font-display">{selectedVehicle?.price || '£140.00'}</p>
            </div>
            <div className="text-right">
              <span className="material-symbols-outlined text-green-500 text-3xl">verified</span>
            </div>
          </div>
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="group w-full py-5 lg:py-6 bg-primary text-white font-black rounded-[20px] lg:rounded-[24px] shadow-3xl shadow-primary/30 transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-70 text-[10px] uppercase tracking-widest"
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

      <main className="flex-1 bg-gray-50 dark:bg-black relative overflow-hidden hidden lg:block">
        <div className="h-full w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400" 
            alt="London Architecture" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
          <div className="absolute bottom-16 left-16 max-w-2xl text-left">
            <h2 className="text-6xl md:text-8xl font-black text-white font-display mb-8 leading-tight drop-shadow-2xl">
              {t.arrivalTitle}
            </h2>
            <p className="text-white/90 text-xl md:text-2xl font-medium leading-relaxed drop-shadow-lg mb-10 max-w-xl">
              Professional, punctual, and prepared. Your destination awaits with Transfer Line.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RideCompleted;
