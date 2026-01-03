/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage, Language } from '../../lib/language';

interface VehicleCardProps {
  vehicle: {
    name: string;
    model: string;
    sub: string;
    seats: number;
    bags: number;
    img: string | string[];
    tag?: string;
  };
  index: number;
  isVisible: boolean;
  onSelect?: (vehicleName: string) => void;
}

const FleetCard: React.FC<VehicleCardProps> = ({ vehicle, index, isVisible, onSelect }) => {
  const { language } = useLanguage();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const images = Array.isArray(vehicle.img) ? vehicle.img : [vehicle.img];
  const activeImg = images[Math.min(imgIndex, images.length - 1)];

  const [frontImg, setFrontImg] = useState<string>(activeImg);
  const [backImg, setBackImg] = useState<string>(activeImg);
  const [showFront, setShowFront] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => setReduceMotion(mq.matches);
    update();

    // TypeScript thinks MediaQueryList always has addEventListener, but older Safari
    // only supports addListener/removeListener.
    const mqCompat = mq as unknown as {
      addEventListener?: (type: 'change', listener: () => void) => void;
      removeEventListener?: (type: 'change', listener: () => void) => void;
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };

    if (typeof mqCompat.addEventListener === 'function') {
      mqCompat.addEventListener('change', update);
      return () => mqCompat.removeEventListener?.('change', update);
    }

    mqCompat.addListener?.(update);
    return () => mqCompat.removeListener?.(update);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (images.length < 2) return;
    if (reduceMotion) return;

    const id = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % images.length);
    }, 7_000);

    return () => clearInterval(id);
  }, [isVisible, images.length, reduceMotion]);

  useEffect(() => {
    if (images.length < 2) return;
    if (isTransitioning) return;

    const currentlyVisible = showFront ? frontImg : backImg;
    if (activeImg === currentlyVisible) return;

    // Load into the hidden layer, then flip opacity.
    const nextIsFront = !showFront;
    if (nextIsFront) setFrontImg(activeImg);
    else setBackImg(activeImg);

    const img = new Image();
    img.src = activeImg;
    img.decoding = 'async';

    const onLoad = () => {
      setIsTransitioning(true);
      setShowFront(nextIsFront);
    };

    img.addEventListener('load', onLoad);
    return () => {
      img.removeEventListener('load', onLoad);
    };
  }, [activeImg, backImg, frontImg, images.length, isTransitioning, showFront]);

  const handleFadeComplete = (e: React.TransitionEvent<HTMLImageElement>) => {
    if (e.propertyName !== 'opacity') return;
    if (!isTransitioning) return;
    setIsTransitioning(false);
  };

  const translations = {
    [Language.EN]: { seats: 'Seats', bags: 'Bags', book: 'Book Now' },
    [Language.ES]: { seats: 'Asientos', bags: 'Maletas', book: 'Obtener Presupuesto' },
    [Language.FR]: { seats: 'Sièges', bags: 'Bagages', book: 'Obtenir un Devis' },
    [Language.DE]: { seats: 'Sitze', bags: 'Gepäck', book: 'Angebot Anfordern' },
  } as const;

  const t = translations[language];

  const handleMove = (clientX: number, clientY: number) => {
    if (reduceMotion) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const moveX = (clientX - centerX) / (rect.width / 2);
    const moveY = (clientY - centerY) / (rect.height / 2);
    setOffset({ x: moveX * -12, y: moveY * -12 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => handleMove(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handleMove(e.clientX, e.clientY);

  const handlePointerLeave = () => setOffset({ x: 0, y: 0 });
  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <div 
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transitionDelay: `${index * 150}ms` }}
      className={`group relative rounded-[32px] overflow-hidden bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:shadow-3xl flex flex-col h-full transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
      }`}
    >
      <div className="h-72 overflow-hidden relative bg-slate-900">
        {isVisible && (
          <>
            <img
              src={frontImg}
              alt={`${vehicle.name} ${vehicle.model}`}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              onTransitionEnd={handleFadeComplete}
              className={`absolute inset-0 block w-full h-full object-cover transition-opacity duration-700 ease-out will-change-transform transform-gpu ${showFront ? 'opacity-100' : 'opacity-0'} ${imgLoaded ? 'grayscale-[0.2] group-hover:grayscale-0 group-active:grayscale-0' : ''}`}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.08)`,
              }}
            />
            <img
              src={backImg}
              alt={`${vehicle.name} ${vehicle.model}`}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              onTransitionEnd={handleFadeComplete}
              className={`absolute inset-0 block w-full h-full object-cover transition-opacity duration-700 ease-out will-change-transform transform-gpu ${showFront ? 'opacity-0' : 'opacity-100'} ${imgLoaded ? 'grayscale-[0.2] group-hover:grayscale-0 group-active:grayscale-0' : ''}`}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.08)`,
              }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
        
        {vehicle.tag && (
          <div className="absolute top-6 right-6 bg-primary/90 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] z-10 shadow-xl border border-white/20">
            {vehicle.tag}
          </div>
        )}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="p-7 flex flex-col flex-grow relative">
        <div className="mb-4">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">{vehicle.name}</p>
          <h3 className="text-[26px] font-black text-slate-900 dark:text-white leading-tight font-display">{vehicle.model}</h3>
        </div>
        
        <p className="text-[13px] text-text-muted dark:text-slate-200 mb-6 leading-relaxed font-medium">
          {vehicle.sub}
        </p>
        
        <div className="flex gap-4 mb-8">
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary mb-1.5 text-2xl">airline_seat_recline_normal</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-slate-200">{t.seats}: {vehicle.seats}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary mb-1.5 text-2xl">luggage</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-slate-200">{t.bags}: {vehicle.bags}</span>
          </div>
        </div>

        <button 
          onClick={() => onSelect?.(vehicle.name)}
          className="tl-shine-6s relative overflow-hidden mt-auto w-full py-4 rounded-[18px] bg-slate-900 dark:bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 group-hover:bg-primary group-hover:text-white active:bg-primary active:text-white"
        >
          <span className="relative z-10">{t.book}</span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

interface FleetProps {
  onSelectVehicle?: (vehicleName: string) => void;
}

const Fleet: React.FC<FleetProps> = ({ onSelectVehicle }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { language } = useLanguage();

  const translations = {
    [Language.EN]: {
      badge: 'The Showroom',
      title: 'Bespoke Fleet',
      sub: 'Our curated collection features a hand-picked selection of prestigious vehicles, ensuring every mile is traveled in absolute refinement and cinematic comfort.',
      viewFull: 'View Full Fleet',
      collapse: 'Collapse'
    },
    [Language.ES]: {
      badge: 'La Exposición',
      title: 'Flota Exclusiva',
      sub: 'Nuestra colección seleccionada presenta vehículos prestigiosos para garantizar que cada milla se viaje con refinamiento absoluto y comodidad cinematográfica.',
      viewFull: 'Ver Flota Completa',
      collapse: 'Contraer'
    },
    [Language.FR]: {
      badge: "La Salle d'Exposition",
      title: 'Flotte Sur Mesure',
      sub: 'Notre collection propose des véhicules prestigieux, garantissant que chaque mile se parcourt avec raffinement et confort cinématographique.',
      viewFull: 'Voir la Flotte Complète',
      collapse: 'Réduire'
    },
    [Language.DE]: {
      badge: 'Die Ausstellung',
      title: 'Exklusive Flotte',
      sub: 'Unsere kuratierte Kollektion bietet eine Auswahl prestigeträchtiger Fahrzeuge, sodass jede Meile mit höchstem Komfort und Stil zurückgelegt wird.',
      viewFull: 'Komplette Flotte ansehen',
      collapse: 'Einklappen'
    },
  } as const;

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
      name: 'Saloon Experience',
      model: 'Tesla Model S',
      sub: 'An ultra-quiet cabin and smooth ride quality designed for total relaxation. Experience the future of premium private travel.',
      seats: 3, bags: 3,
      // animate between model image and provided tesla.jpg
      img: ['/images/vehicles/tesla-model-s.jpg', '/images/vehicles/tesla/tesla.jpg'],
      tag: 'Quiet & Refined'
    },
    {
      name: 'SUV Excellence',
      model: 'Mitsubishi Outlander',
      sub: 'Exceptional space and a commanding view of the road. Perfect for families seeking a safe, versatile, and high-end journey.',
      seats: 4, bags: 4,
      img: ['/images/vehicles/mitsubishi-outlander-2.png', '/images/vehicles/mitsubishi-outlander.png'],
      tag: 'Spacious Comfort'
    },
    {
      name: 'Executive MPV',
      model: 'Mercedes-Benz V-Class',
      sub: 'A masterpiece of versatility and luxury. Perfectly configured for small groups or executive board meetings on the move.',
      seats: 7, bags: 6,
      // Now uses two frames so the card will animate (similar to Mitsubishi Outlander)
      img: ['/images/vehicles/mercedes-v-class/uhn.png', '/images/vehicles/mercedes-v-class/uhn2.png'],
      tag: 'Corporate People Mover'
    },
    {
      name: 'MPV Voyager',
      model: 'Volkswagen Sharan',
      sub: 'The ultimate choice for group transfers. Generous seating and ample storage without compromising on passenger comfort.',
      seats: 6, bags: 5,
      img: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=85&w=1600&auto=format&fit=crop',
      tag: 'Group Travel'
    },
    {
      name: 'Elite Class',
      model: 'Mercedes-Benz S-Class',
      sub: 'A benchmark in premium travel. Impeccable attention to detail and a smooth-as-glass ride for the most discerning travelers.',
      seats: 3, bags: 2,
      img: '/images/vehicles/mercedes-s-class.png',
      tag: 'Iconic Excellence'
    }
  ];

  const displayedVehicles = showAll ? vehicles : vehicles.slice(0, 3);

  return (
    <section ref={sectionRef} className="py-32 bg-background-light dark:bg-background-dark relative overflow-hidden">
      <div className="w-full px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
          <div className="max-w-3xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
               <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
               <span className="text-[11px] font-black text-primary tracking-[0.3em] uppercase">{t.badge}</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
              {t.title.split(' ').slice(0, -1).join(' ')} <br/>
              <span className="text-primary italic font-display">{t.title.split(' ').slice(-1)}</span>
            </h2>
            <p className="text-text-muted dark:text-slate-200 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl">
              {t.sub}
            </p>
          </div>

          <button
            onClick={() => setShowAll(!showAll)}
            className="tl-shine-6s group flex items-center gap-6 px-10 py-5 rounded-[24px] border border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:text-white transition-all shadow-2xl shadow-primary/5 active:scale-95"
          >
            {showAll ? t.collapse : t.viewFull}
            <span className={`material-symbols-outlined transition-transform duration-500 ${showAll ? 'rotate-180' : 'group-hover:translate-x-2'}`}>
              {showAll ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {displayedVehicles.map((v, i) => (
            <FleetCard key={i} vehicle={v} index={i} isVisible={isVisible} onSelect={onSelectVehicle} />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="tl-shine-6s group flex items-center gap-6 px-10 py-5 rounded-[24px] border border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:text-white transition-all shadow-2xl shadow-primary/5 active:scale-95"
          >
            {showAll ? t.collapse : t.viewFull}
            <span className={`material-symbols-outlined transition-transform duration-500 ${showAll ? 'rotate-180' : 'group-hover:translate-x-2'}`}>
              {showAll ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Cinematic decorative background elements */}
      <div className="absolute top-1/4 -right-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-64 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
    </section>
  );
};

export default Fleet;
