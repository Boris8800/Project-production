
"use client";

import React, { useEffect, useState } from 'react';

const CAROUSEL_IMAGES = [
  '/images/backgrounds/hero-luxury-car.jpg',
  '/images/backgrounds/luxury-interior.jpg',
  '/images/backgrounds/uk-map.jpg',
  '/images/vehicles/mercedes-s-class.png'
];

// Image carousel component (module-scoped, above `Routes` to avoid JSX parse issues)
const ImageCarousel: React.FC<{ intervalMs?: number }> = ({ intervalMs = 5000 }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = CAROUSEL_IMAGES.length; 

  // Preload images once
  useEffect(() => {
    CAROUSEL_IMAGES.forEach((s) => { const img = new Image(); img.src = s; });
  }, []);

  // Auto-advance when not paused
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % len), intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs, len]);

  const prev = () => setIndex((i) => (i - 1 + len) % len);
  const next = () => setIndex((i) => (i + 1) % len);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + len) % len);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % len);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [len]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-label="Popular routes image carousel"
    >
      {CAROUSEL_IMAGES.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000`}
          style={{ backgroundImage: `url('${src}')`, opacity: index === i ? 1 : 0 }}
          aria-hidden={index !== i}
        />
      ))}

      {/* Controls */}
      <div className="absolute inset-0 flex items-center justify-between px-3 md:px-5 pointer-events-none">
        <button onClick={prev} className="pointer-events-auto bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition" aria-label="Previous image">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button onClick={next} className="pointer-events-auto bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition" aria-label="Next image">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Indicator dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className={`w-2 h-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'} transition`} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};

const Routes: React.FC = () => {
  const routes = [
    { from: 'London', to: 'Oxford', time: '1h 45m', price: '£180' },
    { from: 'Manchester', to: 'Edinburgh', time: '4h 15m', price: '£420' },
    { from: 'Heathrow Airport', to: 'Central London', time: '1h 10m', price: '£95' }
  ];

  return (
    <section className="py-16 md:py-24 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-surface-dark-lighter">
      <div className="w-full px-6 md:px-10 flex flex-col lg:flex-row gap-10 md:gap-16">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-surface-dark-lighter mb-6">
            <span className="text-xs font-bold text-primary tracking-wide uppercase">Popular UK Routes</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-8">Seamless Connectivity</h2>
          <p className="text-text-muted dark:text-slate-200 mb-10 leading-relaxed text-lg">
            Reliable chauffeur services across the United Kingdom. We navigate the motorway network so you don&apos;t have to.
          </p>
          
          <div className="flex flex-col gap-4 md:gap-5">
            {routes.map((r, i) => (
              <a 
                key={i} 
                className="flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-dark-lighter hover:border-primary hover:scale-[1.02] hover:bg-slate-50 dark:hover:bg-surface-dark-lighter/40 hover:shadow-xl dark:hover:shadow-primary/5 group transition-all duration-300 ease-out" 
                href="#"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="size-10 sm:size-12 rounded-full bg-gray-100 dark:bg-surface-dark-lighter flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <span className="material-symbols-outlined">east</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                      {r.from} <span className="text-text-muted dark:text-slate-200 px-2 font-medium">to</span> {r.to}
                    </h4>
                    <p className="text-xs text-text-muted dark:text-slate-200 font-medium mt-1">Est. {r.time} • Fixed at {r.price}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted dark:text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">chevron_right</span>
              </a>
            ))}
          </div>
        </div>
        
        <div className="flex-1 h-[260px] sm:h-[320px] md:h-[450px] lg:h-auto rounded-3xl overflow-hidden relative shadow-2xl border border-white/5 group">
          {/* Image carousel: cycles every 5s with fade transition, preloads, has controls and pause-on-hover */}

          {/* ImageCarousel implemented below (uses local /images assets for production stability) */}
          <ImageCarousel />

          <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply"></div>

          <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8 bg-surface-dark/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="size-9 md:size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">explore</span>
              </div>
              <div>
                <h5 className="text-white font-bold text-base">Route Knowledge</h5>
                <p className="text-slate-200 text-xs mt-2 leading-relaxed">
                  Our chauffeurs possess expert knowledge of UK road networks, Congestion Charge zones, and optimal routes for timely arrival.
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default Routes;
