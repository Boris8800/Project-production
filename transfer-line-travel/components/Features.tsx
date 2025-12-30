
import React from 'react';
import { Language } from '../types';

interface FeaturesProps {
  language: Language;
}

const Features: React.FC<FeaturesProps> = ({ language }) => {
  const translations = {
    [Language.EN]: {
      badge: 'Our Commitment',
      title: 'Why Choose Transfer Line?',
      sub: 'We redefine long-distance travel with professional drivers and a heritage of excellence.',
      f1_title: 'Executive Comfort',
      f1_desc: 'Spacious legroom, climate control, and pristine interiors ensure you arrive refreshed, no matter the distance.',
      f2_title: 'Expert Chauffeurs',
      f2_desc: 'Our professional drivers possess long experience and unmatched road knowledge, ensuring safe and smooth intercity travel.',
      f3_title: 'Always On Time',
      f3_desc: 'Our advanced tracking and seasoned chauffeurs guarantee a 99.9% on-time arrival rate for every UK journey.'
    },
    [Language.ES]: {
      badge: 'Nuestro Compromiso',
      title: '¿Por qué elegir Transfer Line?',
      sub: 'Redefinimos los viajes de larga distancia con conductores profesionales y una herencia de excelencia.',
      f1_title: 'Confort de Élite',
      f1_desc: 'Espacio amplio para las piernas, climatización e interiores impecables que garantizan que llegue descansado.',
      f2_title: 'Chóferes Expertos',
      f2_desc: 'Nuestros conductores profesionales poseen una amplia experiencia y un conocimiento vial inigualable.',
      f3_title: 'Siempre Puntuales',
      f3_desc: 'Nuestro seguimiento avanzado garantiza una tasa de llegada puntual del 99.9% en cada viaje.'
    },
    [Language.DE]: {
      badge: 'Unser Engagement',
      title: 'Warum Transfer Line wählen?',
      sub: 'Wir definieren Fernreisen mit professionellen Fahrern und einer Tradition der Exzellenz neu.',
      f1_title: 'Exklusiver Komfort',
      f1_desc: 'Großzügige Beinfreiheit, Klimaanlage und makellose Innenausstattung sorgen dafür, dass Sie erfrischt ankommen.',
      f2_title: 'Experten-Chauffeure',
      f2_desc: 'Unsere professionellen Fahrer verfügen über langjährige Erfahrung und unübertroffene Straßenkenntnisse.',
      f3_title: 'Immer Pünktlich',
      f3_desc: 'Unsere fortschrittliche Verfolgung garantiert eine Pünktlichkeitsrate von 99,9 % bei jeder Fahrt.'
    },
    [Language.FR]: {
      badge: 'Notre Engagement',
      title: 'Pourquoi choisir Transfer Line ?',
      sub: 'Nous redéfinissons les voyages longue distance avec des chauffeurs professionnels et un héritage d\'excellence.',
      f1_title: 'Confort d\'Excellence',
      f1_desc: 'Un espace généreux pour les jambes, la climatisation et des intérieurs impeccables pour arriver reposé.',
      f2_title: 'Chauffeurs Experts',
      f2_desc: 'Nos chauffeurs professionnels possèdent une longue expérience et une connaissance inégalée de la route.',
      f3_title: 'Toujours à l\'heure',
      f3_desc: 'Notre suivi avancé garantit un taux d\'arrivée à l\'heure de 99,9 % pour chaque trajet au Royaume-Uni.'
    }
  };

  const t = translations[language];

  const features = [
    { icon: 'airline_seat_recline_extra', title: t.f1_title, desc: t.f1_desc },
    { icon: 'verified_user', title: t.f2_title, desc: t.f2_desc },
    { icon: 'schedule', title: t.f3_title, desc: t.f3_desc }
  ];

  return (
    <section className="py-32 bg-background-light dark:bg-background-dark relative overflow-hidden theme-transition">
      {/* Decorative background element for Dark Mode depth */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full hidden dark:block"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.3em] mb-8">
            {t.badge}
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter drop-shadow-sm">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed">{t.sub}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <div key={i} className="group p-12 rounded-[48px] bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:border-primary/50 transition-all duration-500 hover:shadow-4xl hover:-translate-y-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all text-primary shadow-lg shadow-primary/5 relative z-10">
                <span className="material-symbols-outlined text-4xl">{f.icon}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 relative z-10">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-medium relative z-10">
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
