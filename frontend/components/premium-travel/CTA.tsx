"use client";

import React from 'react';
import { useLanguage, Language } from '../../lib/language';

interface CTAProps {
  onBookClick?: () => void;
}

const CTA: React.FC<CTAProps> = ({ onBookClick }) => {
  const { language } = useLanguage();

  const translations = {
    [Language.EN]: {
      badge: 'Refined Solutions', title: 'Bespoke Travel Services',
      sub: 'We provide more than just a ride. Our refined travel options are tailored to the discerning schedules of private individuals and specialized event logistics.',
      button: 'Book Your Experience',
      s1_title: 'Airport Transfers', s1_desc: 'Fixed-rate transfers to all major UK airports with meet & greet service as standard for families and private travelers.',
      s2_title: 'Intercity Chauffeur', s2_desc: 'Door-to-door transfers with professional drivers and long experience. Travel in the comfort of our elite fleet.',
      s3_title: 'Special Events', s3_desc: 'Coordinated transport for private gatherings, weddings, and exclusive personal events.',
      stat1_val: '25+', stat1_lbl: 'UK Airports',
      stat2_val: '100%', stat2_lbl: 'Flight Tracking',
      stat3_val: '4.9/5', stat3_lbl: 'Client Rating',
      stat4_val: '24/7', stat4_lbl: 'Support'
    },
    [Language.ES]: {
      badge: 'Soluciones Refinadas', title: 'Servicios de Viaje Personalizados',
      sub: 'Proporcionamos más que un viaje. Nuestras opciones están adaptadas a los horarios exigentes de personas privadas y logística de eventos.',
      button: 'Reserve su Experiencia',
      s1_title: 'Traslados al Aeropuerto', s1_desc: 'Traslados a tarifa fija a todos los principales aeropuertos del Reino Unido con servicio de recepción estándar para familias.',
      s2_title: 'Chófer Interurbano', s2_desc: 'Traslados de puerta a puerta con conductores profesionales y larga experiencia.',
      s3_title: 'Eventos Especiales', s3_desc: 'Transporte coordinado para reuniones privadas, bodas y eventos personales exclusivos.',
      stat1_val: '25+', stat1_lbl: 'Aeropuertos RU',
      stat2_val: '100%', stat2_lbl: 'Seguimiento de Vuelos',
      stat3_val: '4.9/5', stat3_lbl: 'Puntuación',
      stat4_val: '24/7', stat4_lbl: 'Soporte'
    },
    [Language.FR]: {
      badge: 'Solutions Raffinées', title: 'Services de Voyage Sur Mesure',
      sub: 'Nous offrons plus qu\'un simple trajet. Nos options de voyage sont adaptées aux horaires exigeants des particuliers.',
      button: 'Réservez Votre Expérience',
      s1_title: 'Transferts Aéroport', s1_desc: 'Transferts à tarif fixe vers tous les principaux aéroports britanniques avec service d\'accueil standard pour les familles.',
      s2_title: 'Chauffeur Interurbain', s2_desc: 'Transferts porte-à-porte avec des chauffeurs professionnels expérimentés.',
      s3_title: 'Événements Spéciaux', s3_desc: 'Transport coordonné pour rassemblements privés, mariages et événements exclusifs.',
      stat1_val: '25+', stat1_lbl: 'Aéroports RU',
      stat2_val: '100%', stat2_lbl: 'Suivi de Vols',
      stat3_val: '4.9/5', stat3_lbl: 'Note',
      stat4_val: '24/7', stat4_lbl: 'Support'
    },
    [Language.DE]: {
      badge: 'Exklusive Lösungen', title: 'Reiseservices',
      sub: 'Wir bieten mehr als nur eine Fahrt. Unsere Optionen sind auf anspruchsvolle Pläne zugeschnitten.',
      button: 'Buchen',
      s1_title: 'Flughafentransfer', s1_desc: 'Transfers zu allen großen UK-Flughäfen mit Meet & Greet-Service für Familien.',
      s2_title: 'Fernfahrten', s2_desc: 'Tür-zu-Tür-Transfers mit professionellen Fahrern.',
      s3_title: 'Events', s3_desc: 'Transport für private Veranstaltungen, Hochzeiten und Events.',
      stat1_val: '25+', stat1_lbl: 'UK-Flughäfen',
      stat2_val: '100%', stat2_lbl: 'Flug-Tracking',
      stat3_val: '4.9/5', stat3_lbl: 'Bewertung',
      stat4_val: '24/7', stat4_lbl: 'Support'
    },
  } as const;

  const t = translations[language];

  const companyServices = [
    {
      title: t.s1_title,
      icon: "flight_takeoff",
      desc: t.s1_desc
    },
    {
      title: t.s2_title,
      icon: "distance",
      desc: t.s2_desc
    },
    {
      title: t.s3_title,
      icon: "celebration",
      desc: t.s3_desc
    }
  ];

  return (
    <section className="relative min-h-[800px] flex items-center justify-center py-24 overflow-hidden">
      {/* Cinematic Airport Background with Airplane */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[30s] scale-110"
        style={{ 
          backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.6), rgba(12, 11, 9, 0.9)), url('https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&q=85&w=2400')`,
          backgroundAttachment: 'fixed'
        }}
      />

      <div className="relative z-10 w-full px-6 md:px-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8 backdrop-blur-md">
              <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
              <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">{t.badge}</span>
            </div>
            
            <h2 className={`font-black text-white mb-8 leading-[0.9] tracking-tighter ${language === Language.DE ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl'}`}>
              {t.title.split(' ').slice(0, -1).join(' ')} <br/>
              <span className="text-primary italic font-display">{t.title.split(' ').slice(-1)}</span>
            </h2>
            
            <p className="text-slate-200 text-xl font-medium mb-12 max-w-xl leading-relaxed">
              {t.sub}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={onBookClick}
                className="px-10 py-5 bg-primary text-white font-black rounded-[20px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-4 text-sm uppercase tracking-widest"
              >
                {t.button}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {companyServices.map((service, idx) => (
              <div 
                key={idx} 
                className="group p-8 rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-primary/50 transition-all duration-500 hover:bg-white/10 flex items-start gap-6"
              >
                <div className="shrink-0 size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                  <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white mb-2 tracking-tight">{service.title}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative stats bar */}
        <div className="mt-24 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto justify-items-center">
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1 font-display tracking-tight">{t.stat1_val}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t.stat1_lbl}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1 font-display tracking-tight">{t.stat2_val}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t.stat2_lbl}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1 font-display tracking-tight">{t.stat3_val}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t.stat3_lbl}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1 font-display tracking-tight">{t.stat4_val}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t.stat4_lbl}</p>
          </div>
        </div>
      </div>
      
      {/* Grainy overlay for cinematic feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </section>
  );
};

export default CTA;