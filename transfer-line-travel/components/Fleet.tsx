
import React, { useState, useRef, useEffect } from 'react';
import { BookingCategory, Language } from '../types';

interface VehicleCardProps {
  vehicle: {
    name: string;
    model: string;
    sub: string;
    seats: number;
    bags: number;
    img: string;
    tag?: string;
    category?: BookingCategory;
  };
  index: number;
  isVisible: boolean;
  onBook: () => void;
  language: Language;
}

const FleetCard: React.FC<VehicleCardProps> = ({ vehicle, index, isVisible, onBook, language }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const moveX = (e.clientX - centerX) / (rect.width / 2);
    const moveY = (e.clientY - centerY) / (rect.height / 2);
    setOffset({ x: moveX * -10, y: moveY * -10 });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  const translations = {
    [Language.EN]: { book: 'Book This Experience', seats: 'Seats', bags: 'Bags' },
    [Language.ES]: { book: 'Reservar esta experiencia', seats: 'Plazas', bags: 'Maletas' },
    [Language.DE]: { book: 'Dieses Erlebnis buchen', seats: 'Sitze', bags: 'Gepäck' },
    [Language.FR]: { book: 'Réserver cette expérience', seats: 'Sièges', bags: 'Sacs' }
  };

  const t = translations[language];

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transitionDelay: `${index * 150}ms` }}
      className={`group relative rounded-[32px] md:rounded-[40px] overflow-hidden bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:shadow-4xl flex flex-col h-full transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
      }`}
    >
      <div className="h-56 md:h-72 overflow-hidden relative">
        {isVisible && (
           <img 
            src={vehicle.img}
            alt={`${vehicle.name} ${vehicle.model}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-out ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60"></div>
        
        {vehicle.tag && (
          <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-primary/90 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] z-10 shadow-xl">
            {vehicle.tag}
          </div>
        )}
      </div>

      <div className="p-6 md:p-10 flex flex-col flex-grow">
        <div className="mb-4 md:mb-6">
          <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2">{vehicle.name}</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight font-display">{vehicle.model}</h3>
        </div>
        
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 leading-relaxed font-medium">
          {vehicle.sub}
        </p>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-8 md:mb-10">
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-slate-50 dark:bg-white/5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary mb-1 text-xl md:text-2xl">airline_seat_recline_normal</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.seats}: {vehicle.seats}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-slate-50 dark:bg-white/5 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary mb-1 text-xl md:text-2xl">luggage</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.bags}: {vehicle.bags}</span>
          </div>
        </div>

        <button 
          onClick={onBook}
          className="relative overflow-hidden mt-auto w-full py-4 md:py-5 rounded-[16px] md:rounded-[20px] bg-slate-900 dark:bg-primary text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] shadow-xl transition-all transform active:scale-95 group"
        >
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          <span className="relative z-10">{t.book}</span>
        </button>
      </div>
    </div>
  );
};

interface FleetProps {
  onSelect?: (cat: BookingCategory) => void;
  language: Language;
}

const Fleet: React.FC<FleetProps> = ({ onSelect, language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const translations = {
    [Language.EN]: {
      badge: 'The Showroom',
      title: 'Bespoke Fleet',
      sub: 'Our curated collection features a hand-picked selection of prestigious vehicles, ensuring every mile is traveled in absolute refinement.',
      viewAll: 'View Full Fleet',
      collapse: 'Collapse',
      v1_name: 'Saloon Experience', v1_sub: 'An ultra-quiet cabin designed for total relaxation.', v1_tag: 'Quiet & Refined',
      v2_name: 'SUV Excellence', v2_sub: 'Exceptional space and a commanding view of the road.', v2_tag: 'Spacious Comfort',
      v3_name: 'MPV Voyager', v3_sub: 'The ultimate choice for group transfers and luggage.', v3_tag: 'Group Travel',
      v4_name: 'V-Class Executive', v4_sub: 'Superior comfort for group travel with a luxury seating arrangement.', v4_tag: '7-Seater Luxury',
      v5_name: 'Vito Executive', v5_sub: 'Extraordinary capacity with the refinement of Mercedes-Benz engineering.', v5_tag: '8-Seater Capacity'
    },
    [Language.ES]: {
      badge: 'La Exhibición',
      title: 'Flota Exclusiva',
      sub: 'Nuestra colección presenta una selección de vehículos prestigiosos, garantizando refinamiento absoluto en cada milla.',
      viewAll: 'Ver toda la flota',
      collapse: 'Contraer',
      v1_name: 'Experiencia Berlina', v1_sub: 'Una cabina ultra silenciosa diseñada para la relajación total.', v1_tag: 'Silencioso y Refinado',
      v2_name: 'Excelencia SUV', v2_sub: 'Espacio excepcional y una vista dominante de la carretera.', v2_tag: 'Confort Espacioso',
      v3_name: 'Viajero MPV', v3_sub: 'La opción definitiva para traslados grupales y equipaje.', v3_tag: 'Viaje en Grupo',
      v4_name: 'Clase V Ejecutivo', v4_sub: 'Confort superior para viajes en grupo con disposición de lujo.', v4_tag: 'Lujo 7 Plazas',
      v5_name: 'Vito Ejecutivo', v5_sub: 'Capacidad extraordinaria con el refinamiento de la ingeniería de Mercedes-Benz.', v5_tag: 'Capacidad 8 Plazas'
    },
    [Language.DE]: {
      badge: 'Der Showroom',
      title: 'Exklusive Flotte',
      sub: 'Unsere kuratierte Kollektion bietet eine handverlesene Auswahl an prestigeträchtigen Fahrzeugen für absolute Raffinesse.',
      viewAll: 'Gesamte Flotte ansehen',
      collapse: 'Einklappen',
      v1_name: 'Limousinen-Erlebnis', v1_sub: 'Eine extrem leise Kabine für totale Entspannung.', v1_tag: 'Leise & Raffiniert',
      v2_name: 'SUV-Exzellenz', v2_sub: 'Außergewöhnliches Platzangebot und souveräne Sicht.', v2_tag: 'Geräumiger Komfort',
      v3_name: 'MPV Voyager', v3_sub: 'Die ultimative Wahl für Gruppentransfers und Gepäck.', v3_tag: 'Gruppenreisen',
      v4_name: 'V-Klasse Executive', v4_sub: 'Höchster Komfort für Gruppenreisen mit exklusiver Ausstattung.', v4_tag: '7-Sitzer Luxus',
      v5_name: 'Vito Exklusiv', v5_sub: 'Außergewöhnliche Kapazität mit der Raffinesse von Mercedes-Benz.', v5_tag: '8-Sitzer Kapazität'
    },
    [Language.FR]: {
      badge: 'Le Showroom',
      title: 'Flotte sur Mesure',
      sub: 'Notre collection propose une sélection de véhicules prestigieux, garantissant un raffinement absolu à chaque kilomètre.',
      viewAll: 'Voir toute la flotte',
      collapse: 'Réduire',
      v1_name: 'Expérience Berline', v1_sub: 'Une cabine ultra-silencieuse conçue pour une relaxation totale.', v1_tag: 'Calme et Raffiné',
      v2_name: 'Excellence SUV', v2_sub: 'Un espace exceptionnel et une vue imprenable sur la route.', v2_tag: 'Confort Spacieux',
      v3_name: 'MPV Voyager', v3_sub: 'Le choix ultime pour les transferts de groupe et les bagages.', v3_tag: 'Voyage de Groupe',
      v4_name: 'Classe V Executive', v4_sub: 'Confort supérieur pour les voyages de groupe avec une disposition de luxe.', v4_tag: 'Luxe 7 Places',
      v5_name: 'Vito Excellence', v5_sub: 'Capacité extraordinaire avec le raffinement de l\'ingénierie Mercedes-Benz.', v5_tag: '8 Places Maximum'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const vehicles = [
    {
      name: t.v1_name, model: 'Tesla Model S', sub: t.v1_sub, seats: 3, bags: 3,
      img: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?q=85&w=1600&auto=format&fit=crop',
      tag: t.v1_tag, category: BookingCategory.INTERCITY
    },
    {
      name: t.v2_name, model: 'Mitsubishi Outlander', sub: t.v2_sub, seats: 4, bags: 4,
      img: '/images/vehicles/mitsubishi-outlander.png',
      tag: t.v2_tag, category: BookingCategory.INTERCITY
    },
    {
      name: t.v3_name, model: 'Volkswagen Sharan', sub: t.v3_sub, seats: 6, bags: 5,
      img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=85&w=1600&auto=format&fit=crop',
      tag: t.v3_tag, category: BookingCategory.AIRPORT
    },
    {
      name: t.v4_name, model: 'Mercedes-Benz V-Class', sub: t.v4_sub, seats: 7, bags: 6,
      img: '/images/vehicles/mercedes-v-class.jpg',
      tag: t.v4_tag, category: BookingCategory.AIRPORT
    },
    {
      name: t.v5_name, model: 'Mercedes-Benz Vito Tourer', sub: t.v5_sub, seats: 8, bags: 8,
      img: 'https://images.unsplash.com/photo-1549411223-398244d6935c?q=85&w=1600&auto=format&fit=crop',
      tag: t.v5_tag, category: BookingCategory.AIRPORT
    }
  ];

  const displayedVehicles = showAll ? vehicles : vehicles.slice(0, 3);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-background-light dark:bg-background-dark theme-transition" id="fleet">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-8 md:gap-10">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 md:mb-8">
               <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
               <span className="text-[9px] md:text-[10px] font-black text-primary tracking-[0.2em] md:tracking-[0.3em] uppercase">{t.badge}</span>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8 leading-[1] md:leading-[0.9] tracking-tighter text-slate-900 dark:text-white">
              {t.title.split(' ')[0]} <br/>
              <span className="text-primary italic font-display">{t.title.split(' ')[1]}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
              {t.sub}
            </p>
          </div>

          <button
            onClick={() => setShowAll(!showAll)}
            className="group flex items-center gap-4 md:gap-8 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[24px] border border-primary text-primary font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] hover:bg-primary hover:text-white transition-all active:scale-95"
          >
            {showAll ? t.collapse : t.viewAll}
            <span className={`material-symbols-outlined transition-transform duration-500 ${showAll ? 'rotate-180' : 'group-hover:translate-x-2'}`}>
              {showAll ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {displayedVehicles.map((v, i) => (
            <FleetCard 
              key={i} 
              vehicle={v} 
              index={i} 
              isVisible={isVisible} 
              onBook={() => onSelect?.(v.category || BookingCategory.INTERCITY)}
              language={language}
            />
          ))}
        </div>

        <div className="mt-10 md:mt-14 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="group flex items-center gap-4 md:gap-8 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[24px] border border-primary text-primary font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] hover:bg-primary hover:text-white transition-all active:scale-95"
          >
            {showAll ? t.collapse : t.viewAll}
            <span className={`material-symbols-outlined transition-transform duration-500 ${showAll ? 'rotate-180' : 'group-hover:translate-x-2'}`}>
              {showAll ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Fleet;
