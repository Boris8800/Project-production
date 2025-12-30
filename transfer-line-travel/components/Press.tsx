
import React from 'react';
import { Language } from '../types';

interface PressProps {
  onBack: () => void;
  language: Language;
}

const Press: React.FC<PressProps> = ({ onBack, language }) => {
  const translations = {
    [Language.EN]: {
      badge: 'Newsroom',
      title: 'Press & Media',
      sub: 'Official announcements, industry insights, and corporate resources for our global media partners.',
      featuredTitle: 'Featured Mentions',
      releasesTitle: 'Press Releases',
      kitTitle: 'Media Kit',
      kitDesc: 'Access our official brand guidelines, high-resolution logos, and executive photography.',
      download: 'Download Kit',
      back: 'Return Home',
      pr1_date: 'May 14, 2024', pr1_title: 'Transfer Line Announces Full Electrification of Executive Fleet',
      pr2_date: 'April 02, 2024', pr2_title: 'Winner: UK Chauffeur Service of the Year 2024',
      pr3_date: 'March 10, 2024', pr3_title: 'Expansion into Northern Scotland: Bespoke Routes Now Active'
    },
    [Language.ES]: {
      badge: 'Sala de Prensa',
      title: 'Prensa y Medios',
      sub: 'Anuncios oficiales, perspectivas de la industria y recursos corporativos para nuestros socios globales.',
      featuredTitle: 'Menciones Destacadas',
      releasesTitle: 'Comunicados de Prensa',
      kitTitle: 'Kit de Medios',
      kitDesc: 'Acceda a nuestras guías de marca oficiales, logotipos de alta resolución y fotografía ejecutiva.',
      download: 'Descargar Kit',
      back: 'Volver al Inicio',
      pr1_date: '14 de mayo, 2024', pr1_title: 'Transfer Line anuncia la electrificación total de su flota ejecutiva',
      pr2_date: '02 de abril, 2024', pr2_title: 'Ganador: Servicio de Chófer del Año en el Reino Unido 2024',
      pr3_date: '10 de marzo, 2024', pr3_title: 'Expansión al norte de Escocia: Rutas a medida ahora activas'
    },
    [Language.DE]: {
      badge: 'Newsroom',
      title: 'Presse & Medien',
      sub: 'Offizielle Ankündigungen, Brancheneinblicke und Ressourcen für unsere globalen Medienpartner.',
      featuredTitle: 'Herausragende Erwähnungen',
      releasesTitle: 'Pressemitteilungen',
      kitTitle: 'Pressemappe',
      kitDesc: 'Greifen Sie auf unsere offiziellen Markenrichtlinien, hochauflösende Logos und Executive-Fotografie zu.',
      download: 'Mappe herunterladen',
      back: 'Zurück zum Dashboard',
      pr1_date: '14. Mai 2024', pr1_title: 'Transfer Line kündigt vollständige Elektrifizierung der Executive-Flotte an',
      pr2_date: '02. April 2024', pr2_title: 'Gewinner: UK Chauffeur-Service des Jahres 2024',
      pr3_date: '10. März 2024', pr3_title: 'Expansion nach Nordschottland: Maßgeschneiderte Routen jetzt aktiv'
    },
    [Language.FR]: {
      badge: 'Salle de Presse',
      title: 'Presse et Médias',
      sub: 'Annonces officielles, analyses du secteur et ressources pour nos partenaires médias internationaux.',
      featuredTitle: 'Mentions Spéciales',
      releasesTitle: 'Communiqués de Presse',
      kitTitle: 'Kit Média',
      kitDesc: 'Accédez à nos directives de marque officielles, logos haute résolution et photos de direction.',
      download: 'Télécharger le Kit',
      back: 'Retour à l\'Accueil',
      pr1_date: '14 mai 2024', pr1_title: 'Transfer Line annonce l\'électrification totale de sa flotte executive',
      pr2_date: '02 avril 2024', pr2_title: 'Gagnant : Service de chauffeur britannique de l\'année 2024',
      pr3_date: '10 mars 2024', pr3_title: 'Expansion dans le nord de l\'Écosse : itinéraires sur mesure actifs'
    }
  };

  const t = translations[language];

  const pressReleases = [
    { date: t.pr1_date, title: t.pr1_title, category: 'Corporate' },
    { date: t.pr2_date, title: t.pr2_title, category: 'Awards' },
    { date: t.pr3_date, title: t.pr3_title, category: 'Expansion' }
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen animate-in fade-in duration-700">
      {/* Editorial Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-slate-900 border-b border-white/5">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay grayscale" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504711432869-9d9971c219aa?auto=format&fit=crop&q=85&w=2400')` }}
        />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8">
            <span className="material-symbols-outlined text-primary text-sm">newspaper</span>
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">{t.badge}</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 font-display tracking-tighter leading-[0.9]">
            {t.title}
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            {t.sub}
          </p>
        </div>
      </section>

      {/* Featured Logos */}
      <section className="py-16 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-text-muted uppercase tracking-[0.4em] text-center mb-10">{t.featuredTitle}</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 hover:opacity-100 transition-opacity">
            <span className="font-display text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">The Times</span>
            <span className="font-display text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Forbes</span>
            <span className="font-display text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Financial Times</span>
            <span className="font-display text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">GQ</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-10">{t.releasesTitle}</h2>
            <div className="space-y-8">
              {pressReleases.map((pr, idx) => (
                <article key={idx} className="group cursor-pointer p-8 rounded-[32px] bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 hover:border-primary/50 hover:shadow-2xl transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg">{pr.category}</span>
                    <time className="text-[10px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-widest">{pr.date}</time>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-6 group-hover:text-primary transition-colors">
                    {pr.title}
                  </h3>
                  <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    Read Full Story <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-10 rounded-[40px] bg-primary text-white shadow-3xl sticky top-24">
              <span className="material-symbols-outlined text-5xl mb-6">photo_camera</span>
              <h2 className="text-3xl font-black mb-4 font-display">{t.kitTitle}</h2>
              <p className="text-white/80 leading-relaxed font-medium mb-10">
                {t.kitDesc}
              </p>
              <button className="w-full py-5 bg-white text-primary font-black rounded-2xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px] shadow-xl">
                {t.download}
              </button>
              
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4">Media Contact</p>
                <p className="text-sm font-bold">press@transferline.uk</p>
                <p className="text-xs text-white/60 mt-1">+44 20 7946 0123</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Button */}
      <div className="py-24 flex justify-center border-t border-slate-100 dark:border-white/5">
        <button 
          onClick={onBack}
          className="px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-3xl hover:scale-105 transition-transform uppercase tracking-widest text-xs"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
};

export default Press;
