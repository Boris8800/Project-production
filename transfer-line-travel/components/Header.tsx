
import React, { useState, useEffect, useRef } from 'react';
import BrandLogo from './BrandLogo';
import { BookingCategory, Language } from '../types';

interface HeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  onHomeClick?: () => void;
  onCategoryChange?: (cat: BookingCategory) => void;
  onAboutClick?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  toggleDarkMode,
  isDarkMode,
  onHomeClick, 
  onCategoryChange, 
  onAboutClick,
  language,
  setLanguage
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };

    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLangMenu]);

  const translations = {
    [Language.EN]: { intercity: 'Intercity', airport: 'Airport', about: 'About', login: 'Log In', book: 'Book Now' },
    [Language.ES]: { intercity: 'Interurbano', airport: 'Aeropuerto', about: 'Nosotros', login: 'Acceder', book: 'Reservar' },
    [Language.DE]: { intercity: 'Fernfahrt', airport: 'Flughafen', about: 'Über uns', login: 'Anmelden', book: 'Buchen' },
    [Language.FR]: { intercity: 'Interurbain', airport: 'Aéroport', about: 'À propos', login: 'Connexion', book: 'Réserver' }
  };

  const t = translations[language];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md">
      <div className="px-3 md:px-10 py-4 flex items-center justify-between mx-auto max-w-7xl gap-2">
        {/* Logo and Name Group */}
        <button 
          onClick={onHomeClick} 
          className="flex items-center gap-3 md:gap-4 shrink-0 group transition-all"
        >
          <BrandLogo size={32} className="shadow-sm group-hover:scale-105 transition-transform" />
          <h2 className="text-sm md:text-xl font-bold font-display whitespace-nowrap text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            Transfer Line
          </h2>
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 ml-8">
          <button onClick={() => onCategoryChange?.(BookingCategory.INTERCITY)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors">{t.intercity}</button>
          <button onClick={() => onCategoryChange?.(BookingCategory.AIRPORT)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors">{t.airport}</button>
          <button onClick={onAboutClick} className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors">{t.about}</button>
        </nav>
        
        {/* Utilities */}
        <div className="flex items-center justify-end gap-1 md:gap-4 flex-1">
          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-all"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-xl">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Lang Switcher */}
          <div className="relative" ref={langMenuRef}>
            <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm md:text-base">language</span>
              <span className="hidden sm:inline">{language.toUpperCase()}</span>
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/10 rounded-2xl shadow-4xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {Object.values(Language).map((lang) => (
                  <button key={lang} onClick={() => { setLanguage(lang); setShowLangMenu(false); }} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${language === lang ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:text-primary transition-colors px-4 py-2 whitespace-nowrap">
            {t.login}
          </button>

          {/* Mobile Nav Button */}
          <button onClick={() => setShowMobileNav(!showMobileNav)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-2xl">{showMobileNav ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {showMobileNav && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-background-dark border-b border-gray-100 dark:border-white/5 shadow-2xl animate-in slide-in-from-top-0">
          <nav className="flex flex-col p-6 gap-2">
            <button onClick={() => { onCategoryChange?.(BookingCategory.INTERCITY); setShowMobileNav(false); }} className="flex items-center gap-4 py-4 px-6 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-primary">distance</span>{t.intercity}</button>
            <button onClick={() => { onCategoryChange?.(BookingCategory.AIRPORT); setShowMobileNav(false); }} className="flex items-center gap-4 py-4 px-6 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-primary">flight_takeoff</span>{t.airport}</button>
            <button onClick={() => { onAboutClick?.(); setShowMobileNav(false); }} className="flex items-center gap-4 py-4 px-6 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-primary">info</span>{t.about}</button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
