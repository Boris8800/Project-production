"use client";

import React from 'react';
import { useLanguage, Language } from '../../lib/language';

const Features: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    [Language.EN]: {
      badge: 'Our Commitment',
      title: 'Why Choose Transferline?',
      sub: 'We redefine long-distance travel with professional drivers and a heritage of excellence.',
      f1_title: 'Premium Comfort',
      f1_desc: 'Spacious legroom, climate control, and pristine interiors ensure you arrive refreshed, no matter the distance.',
      f2_title: 'Expert Chauffeurs',
      f2_desc: 'Our professional drivers possess long experience and unmatched road knowledge, ensuring safe and smooth intercity travel.',
      f3_title: 'Always On Time',
      f3_desc: 'Our advanced tracking and seasoned chauffeurs guarantee a 99.9% on-time arrival rate for every UK journey.'
    },
    [Language.ES]: {
      badge: 'Nuestro Compromiso',
      title: '¿Por Qué Elegir Transferline?',
      sub: 'Redefinimos los viajes de larga distancia con conductores profesionales y una herencia de excelencia.',
      f1_title: 'Confort Premium',
      f1_desc: 'Espacio amplio para las piernas, climatización e interiores impecables que garantizan que llegue descansado.',
      f2_title: 'Chóferes Expertos',
      f2_desc: 'Nuestros conductores profesionales poseen una amplia experiencia y un conocimiento vial inigualable.',
      f3_title: 'Siempre Puntuales',
      f3_desc: 'Nuestro seguimiento avanzado garantiza una tasa de llegada puntual del 99.9% en cada viaje.'
    },
    [Language.FR]: {
      badge: 'Notre Engagement',
      title: 'Pourquoi Choisir Transferline?',
      sub: 'Nous redéfinissons les voyages longue distance avec des chauffeurs professionnels et une tradition d\'excellence.',
      f1_title: 'Confort Premium',
      f1_desc: 'Espace pour les jambes, climatisation et intérieurs impeccables pour arriver reposé.',
      f2_title: 'Chauffeurs Experts',
      f2_desc: 'Nos chauffeurs professionnels possèdent une grande expérience et une connaissance inégalée de la route.',
      f3_title: 'Toujours à l\'heure',
      f3_desc: 'Notre suivi avancé garantit un taux de ponctualité de 99,9% pour chaque trajet.'
    },
    [Language.DE]: {
      badge: 'Unser Engagement',
      title: 'Warum Transferline?',
      sub: 'Wir definieren Fernreisen mit professionellen Fahrern und Exzellenz neu.',
      f1_title: 'Premium-Komfort',
      f1_desc: 'Viel Beinfreiheit, Klimaanlage und makellose Innenräume.',
      f2_title: 'Erfahrene Fahrer',
      f2_desc: 'Unsere Fahrer besitzen langjährige Erfahrung und Straßenkenntnis.',
      f3_title: 'Immer Pünktlich',
      f3_desc: 'Unser Tracking garantiert 99,9% pünktliche Ankunft.'
    },
  } as const;

  const t = translations[language];

  const features = [
    {
      icon: 'airline_seat_recline_extra',
      title: t.f1_title,
      desc: t.f1_desc
    },
    {
      icon: 'verified_user',
      title: t.f2_title,
      desc: t.f2_desc
    },
    {
      icon: 'schedule',
      title: t.f3_title,
      desc: t.f3_desc
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-background-dark relative">
      <div className="w-full px-6 md:px-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-[0.2em] mb-4">
            {t.badge}
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-200 max-w-2xl mx-auto text-lg font-medium">{t.sub}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group p-10 rounded-[32px] bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-dark-lighter hover:border-primary transition-all hover:shadow-2xl hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all text-primary shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-4xl">{f.icon}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-200 leading-relaxed text-base font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;