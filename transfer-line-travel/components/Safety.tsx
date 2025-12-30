
import React from 'react';
// Added missing Language import
import { Language } from '../types';

interface SafetyProps {
  onBack: () => void;
  // Added language to props interface
  language: Language;
}

const Safety: React.FC<SafetyProps> = ({ onBack, language }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark animate-in fade-in duration-700 min-h-screen">
      {/* Safety Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] scale-105" 
          style={{ backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.5), rgba(12, 11, 9, 0.95)), url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=85&w=2400')` }}
        />
        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8 backdrop-blur-md">
            <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Uncompromising Standards</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[0.9] font-display">
            Your Safety, <br/>
            <span className="text-primary italic font-display">Our Vocation</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            At Transfer Line, safety isn't a feature—it's the foundation of everything we do.
          </p>
        </div>
      </section>

      {/* Safety Pillars */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 font-display">Chauffeur Vetting</h2>
              <p className="text-text-muted leading-relaxed font-medium mb-6">
                Our selection process is the most rigorous in the industry. Every Transfer Line chauffeur undergoes a comprehensive background check and regular performance audits.
              </p>
              <ul className="space-y-4">
                {[
                  'DBS Enhanced Background Checks',
                  'Professional Chauffeur Training Academy',
                  'Regular Driving Performance Assessments',
                  'Advanced Defensive Driving Certification'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 font-display">Vehicle Integrity</h2>
              <p className="text-text-muted leading-relaxed font-medium mb-6">
                Our bespoke fleet is maintained to aviation-grade standards. We don't just follow legal requirements; we exceed them.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <span className="material-symbols-outlined text-primary mb-3">build</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Inspections</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Weekly detailed checks</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <span className="material-symbols-outlined text-primary mb-3">security</span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">On-board</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Real-time GPS tracking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
             <div className="aspect-[3/4] rounded-[40px] overflow-hidden shadow-4xl group">
               <img 
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800" 
                alt="Safe Vehicle Interior" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent mix-blend-multiply"></div>
             </div>
             <div className="absolute -bottom-6 -right-6 p-8 bg-white dark:bg-surface-dark rounded-3xl shadow-3xl border border-gray-100 dark:border-white/10 max-w-[280px]">
               <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-green-500">verified</span>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Fully Insured</span>
               </div>
               <p className="text-xs text-text-muted leading-relaxed font-medium">
                 Every journey is covered by our comprehensive £10M Public Liability insurance policy.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* Return Button */}
      <div className="py-24 flex justify-center">
        <button 
          onClick={onBack}
          className="px-12 py-6 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
        >
          Return to Booking
        </button>
      </div>
    </div>
  );
};

export default Safety;
