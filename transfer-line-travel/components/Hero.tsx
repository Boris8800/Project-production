
import React, { useState, useEffect, useRef } from 'react';
import { BookingCategory, RideData, Language } from '../types';

interface HeroProps {
  activeCategory: BookingCategory;
  setActiveCategory: (cat: BookingCategory) => void;
  onEstimate?: (data: RideData) => void;
  prefill?: { pickup: string; dropoff: string } | null;
  language: Language;
}

const Hero: React.FC<HeroProps> = ({ activeCategory, setActiveCategory, onEstimate, prefill, language }) => {
  const getTodayDate = () => new Date().toLocaleDateString('en-CA');
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getCurrentTime());
  const [persons, setPersons] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openNativeDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;

    (el as unknown as { showPicker?: () => void }).showPicker?.();
    if (document.activeElement !== el) el.focus();
  };

  const translations = {
    [Language.EN]: {
      headline: "Across Britain In Refinement",
      sub: "Executive intercity travel throughout the UK. Experience superior service without compromise.",
      pickupPl: "Collection Address",
      dropoffPl: "Destination Address",
      dateLabel: "Date",
      timeLabel: "Pickup Time",
      passengers: "Passengers",
      suitcases: "Suitcases",
      quote: "Generate Instant Quote",
      airportPl: "Airport or Flight #"
    },
    [Language.ES]: {
      headline: "Viaje Por Gran Bretaña Con Refinamiento",
      sub: "Viajes interurbanos de élite por todo el Reino Unido. Experimente un servicio superior sin concesiones.",
      pickupPl: "Dirección de Recogida",
      dropoffPl: "Dirección de Destino",
      dateLabel: "Fecha",
      timeLabel: "Hora de Recogida",
      passengers: "Pasajeros",
      suitcases: "Maletas",
      quote: "Obtener Presupuesto",
      airportPl: "Aeropuerto o N° de Vuelo"
    },
    [Language.DE]: {
      headline: "Exzellenz Auf Britischen Straßen",
      sub: "Erstklassige Fernfahrten in ganz Großbritannien. Erleben Sie erstklassigen Service ohne Kompromisse.",
      pickupPl: "Abholadresse",
      dropoffPl: "Zieladresse",
      dateLabel: "Datum",
      timeLabel: "Abholzeit",
      passengers: "Fahrgäste",
      suitcases: "Koffer",
      quote: "Sofortiges Angebot Erstellen",
      airportPl: "Flughafen oder Flugnr."
    },
    [Language.FR]: {
      headline: "L'Excellence À Travers La Grande-Bretagne",
      sub: "Voyages interurbains d'exception dans tout le Royaume-Uni. Découvrez un service superior sans compromis.",
      pickupPl: "Adresse de Prise en Charge",
      dropoffPl: "Adresse de Destination",
      dateLabel: "Date",
      timeLabel: "Heure de Départ",
      passengers: "Passagers",
      suitcases: "Valises",
      quote: "Obtenir un Devis Instantané",
      airportPl: "Aéroport ou N° de Vol"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (prefill) {
      setPickup(prefill.pickup);
      setDropoff(prefill.dropoff);
    }
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [prefill]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 30;
    const y = (clientY / window.innerHeight - 0.5) * 30;
    setMousePos({ x, y });
  };

  const handleSearch = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    const rideData: RideData = { 
      pickup, 
      dropoff, 
      date: date || getTodayDate(), 
      pickupTime: time,
      persons, 
      luggage 
    };
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

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen flex items-center justify-center py-12 md:py-24 px-4 md:px-12 overflow-hidden bg-background-dark"
    >
      <div 
        className="absolute -inset-px z-0 transition-transform duration-[2s] ease-out pointer-events-none"
        style={{ transform: `scale(1.1) translate3d(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px, 0)` }}
      >
        <div 
          className="absolute -inset-px bg-cover bg-center" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.5), rgba(12, 11, 9, 0.95)), url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400')`,
          }}
        />
      </div>

      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(12,11,9,0.5)_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
        <div className={`flex-1 text-center lg:text-left transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6 md:mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] md:text-[11px] font-black text-primary tracking-[0.3em] md:tracking-[0.4em] uppercase">Private & Executive</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[90px] font-black text-white mb-6 md:mb-8 leading-[1] md:leading-[0.85] tracking-tighter">
            {t.headline.split(' ').slice(0, 2).join(' ')}<br/>
            <span className="text-primary italic font-display">{t.headline.split(' ').slice(2).join(' ')}</span>
          </h1>
          
          <p className="text-slate-300 text-lg md:text-xl lg:text-2xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium px-4 md:px-0">
            {t.sub}
          </p>
        </div>

        <div className={`w-full max-w-[620px] transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-white dark:bg-surface-dark rounded-[32px] md:rounded-[48px] shadow-4xl p-6 md:p-10 lg:p-12 overflow-hidden relative border border-white/5">
            <div className="flex border-b border-slate-100 dark:border-white/5 mb-6 md:mb-10">
              {[BookingCategory.INTERCITY, BookingCategory.AIRPORT].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`flex-1 pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all relative ${activeCategory === cat ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {cat === BookingCategory.INTERCITY ? (language === Language.EN ? 'Intercity' : language === Language.ES ? 'Interurbano' : language === Language.DE ? 'Fernfahrten' : 'Interurbain') : (language === Language.EN ? 'Airport' : language === Language.ES ? 'Aeropuerto' : language === Language.DE ? 'Flughafen' : 'Aéroport')}
                  {activeCategory === cat && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 gap-3 md:gap-5">
                <div className="relative group">
                  <span className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl md:text-2xl">my_location</span>
                  <input 
                    type="text" 
                    value={pickup} 
                    onChange={(e) => setPickup(e.target.value)} 
                    className="w-full pl-14 md:pl-16 pr-5 py-4 md:py-6 rounded-[20px] md:rounded-[28px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 focus:border-primary/50 text-sm md:text-base font-bold transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400" 
                    placeholder={activeCategory === BookingCategory.AIRPORT ? t.airportPl : t.pickupPl} 
                  />
                </div>

                <div className="relative group">
                  <span className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl md:text-2xl">location_on</span>
                  <input 
                    type="text" 
                    value={dropoff} 
                    onChange={(e) => setDropoff(e.target.value)} 
                    className="w-full pl-14 md:pl-16 pr-5 py-4 md:py-6 rounded-[20px] md:rounded-[28px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 focus:border-primary/50 text-sm md:text-base font-bold transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400" 
                    placeholder={t.dropoffPl} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3 md:ml-4">{t.dateLabel}</span>
                    <div className="relative group">
                      <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-lg md:text-xl pointer-events-none">calendar_month</span>
                      <input 
                        type="date" 
                        value={date} 
                        min={getTodayDate()}
                        onChange={(e) => setDate(e.target.value)} 
                        ref={dateInputRef}
                        onClick={openNativeDatePicker}
                        onFocus={openNativeDatePicker}
                        className="w-full pl-12 md:pl-16 pr-3 md:pr-4 py-3 md:py-5 rounded-[16px] md:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs md:text-sm font-bold text-slate-900 dark:text-white transition-all outline-none cursor-pointer" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3 md:ml-4">{t.timeLabel}</span>
                    <div className="relative group">
                      <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-lg md:text-xl pointer-events-none">schedule</span>
                      <input 
                        type="time" 
                        value={time} 
                        onChange={(e) => setTime(e.target.value)} 
                        className="w-full pl-12 md:pl-16 pr-3 md:pr-4 py-3 md:py-5 rounded-[16px] md:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs md:text-sm font-bold text-slate-900 dark:text-white transition-all outline-none cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-[16px] md:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5 md:mb-1">{t.passengers}</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="material-symbols-outlined text-primary text-base md:text-lg">person</span>
                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{persons}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => decrement(setPersons, persons, 1)} disabled={persons <= 1} className="size-7 md:size-8 rounded-lg flex items-center justify-center bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm md:text-base">remove</span>
                      </button>
                      <button onClick={() => increment(setPersons, persons, 8)} disabled={persons >= 8} className="size-7 md:size-8 rounded-lg flex items-center justify-center bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm md:text-base">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-[16px] md:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5 md:mb-1">{t.suitcases}</span>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="material-symbols-outlined text-primary text-base md:text-lg">luggage</span>
                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{luggage}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button onClick={() => decrement(setLuggage, luggage, 0)} disabled={luggage <= 0} className="size-7 md:size-8 rounded-lg flex items-center justify-center bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm md:text-base">remove</span>
                      </button>
                      <button onClick={() => increment(setLuggage, luggage, 12)} disabled={luggage >= 12} className="size-7 md:size-8 rounded-lg flex items-center justify-center bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm md:text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSearch} 
                disabled={loading || !pickup || !dropoff} 
                className="w-full py-5 md:py-6 bg-primary text-white font-black text-base md:text-lg rounded-[20px] md:rounded-[28px] shadow-3xl hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[10px] md:text-[12px]"
              >
                {loading ? <span className="animate-spin material-symbols-outlined text-2xl">sync</span> : <span>{t.quote}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">Discover Excellence</span>
        <span className="material-symbols-outlined text-primary animate-bounce text-xl md:text-2xl">keyboard_arrow_down</span>
      </div>
    </section>
  );
};

export default Hero;
