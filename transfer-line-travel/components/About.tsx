
import React from 'react';
import { Language } from '../types';

interface AboutProps {
  onBack: () => void;
  language: Language;
}

const About: React.FC<AboutProps> = ({ onBack, language }) => {
  const translations = {
    [Language.EN]: {
      badge: 'Our Heritage',
      title: 'Defined by Excellence',
      sub: 'Dedicated to reimagining the standards of private intercity travel across the United Kingdom.',
      storyTitle: 'The Transfer Line Story',
      storyP1: 'Transfer Line was born from a simple observation: intercity travel often lacks the personal touch and refinement that travelers deserve.',
      storyP2: 'Based in the heart of the UK, we maintain core values of discretion, safety, and uncompromising quality. Our chauffeurs are trained professionals.',
      stat1_val: '10k+', stat1_lbl: 'Journeys Completed',
      stat2_val: '99.9%', stat2_lbl: 'On-Time Reliability',
      quote: "We don't just move people; we provide the space for them to be their best selves while traveling.",
      ceo: '— CEO, Transfer Line',
      valuesTitle: 'Our Core Values',
      valuesSub: 'The pillars that define every single mile we travel with you.',
      v1_title: 'Absolute Discretion', v1_desc: 'Privacy is the cornerstone of our service. Our chauffeurs are trained in confidentiality.',
      v2_title: 'Uncompromising Safety', v2_desc: 'Every vehicle undergoes rigorous inspections and features the latest safety tech.',
      v3_title: 'Artisanal Quality', v3_desc: 'From climate control to refreshments, every detail is curated for luxury.',
      ctaTitle: 'Experience the Difference',
      ctaButton: 'Book Your First Journey'
    },
    [Language.ES]: {
      badge: 'Nuestra Herencia',
      title: 'Definidos por la Excelencia',
      sub: 'Dedicados a reimaginar los estándares de los viajes interurbanos privados en el Reino Unido.',
      storyTitle: 'La historia de Transfer Line',
      storyP1: 'Transfer Line nació de una observación simple: los viajes interurbanos a menudo carecen del toque personal que los viajeros merecen.',
      storyP2: 'Ubicados en el corazón del Reino Unido, mantenemos valores de discreción, seguridad y calidad. Nuestros chóferes son profesionales capacitados.',
      stat1_val: '10k+', stat1_lbl: 'Viajes completados',
      stat2_val: '99.9%', stat2_lbl: 'Puntualidad',
      quote: "No solo movemos personas; proporcionamos el espacio para que sean su mejor versión mientras viajan.",
      ceo: '— CEO, Transfer Line',
      valuesTitle: 'Nuestros Valores',
      valuesSub: 'Los pilares que definen cada milla que recorremos con usted.',
      v1_title: 'Discreción Absoluta', v1_desc: 'La privacidad es la piedra angular. Nuestros chóferes están entrenados en confidencialidad.',
      v2_title: 'Seguridad Sin Compromiso', v2_desc: 'Cada vehículo pasa inspecciones rigurosas con la última tecnología de seguridad.',
      v3_title: 'Calidad Artesanal', v3_desc: 'Desde el control de clima hasta los refrigerios, cada detalle es un lujo.',
      ctaTitle: 'Experimente la Diferencia',
      ctaButton: 'Reserve su primer viaje'
    },
    [Language.DE]: {
      badge: 'Unser Erbe',
      title: 'Definiert durch Exzellenz',
      sub: 'Wir definieren die Standards für private Fernreisen im Vereinigten Königreich neu.',
      storyTitle: 'Die Transfer Line Story',
      storyP1: 'Transfer Line entstand aus der Beobachtung, dass Fernreisen oft die persönliche Note und Raffinesse fehlen.',
      storyP2: 'Im Herzen Großbritanniens bewahren wir Werte wie Diskretion und Qualität. Unsere Chauffeure sind Profis.',
      stat1_val: '10k+', stat1_lbl: 'Abgeschlossene Fahrten',
      stat2_val: '99.9%', stat2_lbl: 'Pünktlichkeit',
      quote: "Wir bewegen nicht nur Menschen; wir schaffen den Raum, in dem sie während der Reise sie selbst sein können.",
      ceo: '— CEO, Transfer Line',
      valuesTitle: 'Unsere Werte',
      valuesSub: 'Die Säulen, die jede einzelne Meile definieren.',
      v1_title: 'Absolute Diskretion', v1_desc: 'Privatsphäre ist unser Eckpfeiler. Unsere Chauffeure sind auf Vertraulichkeit geschult.',
      v2_title: 'Sicherheit ohne Kompromisse', v2_desc: 'Jedes Fahrzeug wird streng geprüft und bietet modernste Sicherheitstechnik.',
      v3_title: 'Handwerkliche Qualität', v3_desc: 'Vom Klima bis zu den Erfrischungen ist jedes Detail auf Luxus ausgelegt.',
      ctaTitle: 'Erleben Sie den Unterschied',
      ctaButton: 'Erste Reise buchen'
    },
    [Language.FR]: {
      badge: 'Notre Héritage',
      title: 'L\'Excellence en Signature',
      sub: 'Dédiés à réimaginer les standards du voyage interurbain privé au Royaume-Uni.',
      storyTitle: 'L\'Histoire de Transfer Line',
      storyP1: 'Transfer Line est née d\'un constat simple : les voyages longue distance manquent souvent de raffinement.',
      storyP2: 'Basés au cœur du Royaume-Uni, nous cultivons la discrétion et la sécurité. Nos chauffeurs sont des professionnels aguerris.',
      stat1_val: '10k+', stat1_lbl: 'Trajets effectués',
      stat2_val: '99.9%', stat2_lbl: 'Fiabilité horaire',
      quote: "Nous ne nous contentons pas de déplacer des gens ; nous leur offrons un espace pour être eux-mêmes.",
      ceo: '— CEO, Transfer Line',
      valuesTitle: 'Nos Valeurs Fondamentales',
      valuesSub: 'Les piliers qui définissent chaque kilomètre parcouru.',
      v1_title: 'Discrétion Absolue', v1_desc: 'La vie privée est notre priorité. Nos chauffeurs sont formés à la confidentialité.',
      v2_title: 'Sécurité Sans Faille', v2_desc: 'Chaque véhicule subit des inspections strictes avec les dernières technologies.',
      v3_title: 'Qualité Artisanale', v3_desc: 'De la climatisation aux rafraîchissements, chaque détail est un luxe.',
      ctaTitle: 'Découvrez la Différence',
      ctaButton: 'Réservez votre premier trajet'
    }
  };

  const t = translations[language];

  return (
    <div className="bg-background-light dark:bg-background-dark animate-in fade-in duration-700">
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] scale-105" 
          style={{ backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.4), rgba(12, 11, 9, 0.9)), url('https://images.unsplash.com/photo-1449156001931-828420e8f6b4?auto=format&fit=crop&q=85&w=2400')` }}
        />
        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8 backdrop-blur-md">
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">{t.badge}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
            {t.title.split(' ')[0]} <br/>
            <span className="text-primary italic font-display">{t.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            {t.sub}
          </p>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight font-display">{t.storyTitle}</h2>
            <div className="space-y-6 text-slate-600 dark:text-text-muted text-lg leading-relaxed">
              <p>{t.storyP1}</p>
              <p>{t.storyP2}</p>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div>
                <p className="text-4xl font-black text-primary font-display mb-1">{t.stat1_val}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-text-muted uppercase tracking-[0.2em]">{t.stat1_lbl}</p>
              </div>
              <div>
                <p className="text-4xl font-black text-primary font-display mb-1">{t.stat2_val}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-text-muted uppercase tracking-[0.2em]">{t.stat2_lbl}</p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-4xl border border-gray-200 dark:border-white/10">
              <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="absolute -bottom-10 -left-10 p-10 bg-primary rounded-[32px] text-white shadow-3xl hidden md:block max-w-[280px]">
              <span className="material-symbols-outlined text-4xl mb-4">format_quote</span>
              <p className="font-bold text-lg leading-tight italic font-display">{t.quote}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-70">{t.ceo}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 dark:bg-surface-dark/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">{t.valuesTitle}</h2>
            <p className="text-text-muted max-w-xl mx-auto font-medium">{t.valuesSub}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: 'shield_person', title: t.v1_title, desc: t.v1_desc },
              { icon: 'verified', title: t.v2_title, desc: t.v2_desc },
              { icon: 'auto_awesome', title: t.v3_title, desc: t.v3_desc }
            ].map((v, idx) => (
              <div key={idx} className="p-10 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm hover:shadow-2xl transition-all">
                <div className="size-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/5">
                  <span className="material-symbols-outlined text-3xl">{v.icon}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{v.title}</h3>
                <p className="text-slate-500 dark:text-text-muted text-sm leading-relaxed font-medium">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 text-center px-6">
        <h2 className="text-4xl font-black mb-8 text-slate-900 dark:text-white font-display">{t.ctaTitle}</h2>
        <button onClick={onBack} className="px-12 py-6 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-[10px]">
          {t.ctaButton}
        </button>
      </section>
    </div>
  );
};

export default About;
