"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { BookingCategory } from './types';
import { useLanguage } from '../../lib/language';

interface HeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  onHomeClick?: () => void;
  onCategoryChange?: (cat: BookingCategory) => void;
  showNav?: boolean;
  showLoginLink?: boolean;
  loginHref?: string;
  showBookNowButton?: boolean;
  onBookNowClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  toggleDarkMode,
  isDarkMode,
  onHomeClick,
  onCategoryChange,
  showNav = true,
  showLoginLink = true,
  loginHref = '/tenants/customer',
  showBookNowButton = true,
  onBookNowClick,
}) => {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleBookNow = onBookNowClick ?? (() => window.scrollTo({ top: 0, behavior: 'smooth' }));

  useEffect(() => {
    if (!showMobileNav) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMobileNav(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMobileNav]);

  const translations = {
    en: {
      intercity: 'Intercity',
      airport: 'Airport Transfer',
      login: 'Log In',
      book: 'Book Now',
    },
    es: {
      intercity: 'Interurbano',
      airport: 'Traslado al Aeropuerto',
      login: 'Acceder',
      book: 'Reservar',
    },
    fr: {
      intercity: 'Interurbain',
      airport: 'Transfert Aéroport',
      login: 'Connexion',
      book: 'Réserver',
    },
    de: {
      intercity: 'Fernfahrt',
      airport: 'Flughafentransfer',
      login: 'Anmelden',
      book: 'Buchen',
    },
  } as const;

  const t = translations[language];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-surface-dark-lighter bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="w-full px-4 md:px-10 py-3 flex items-center justify-between">
        <button 
          onClick={onHomeClick}
          className="flex items-center gap-4 text-slate-900 dark:text-white hover:opacity-80 transition-opacity cursor-pointer text-left"
        >
          <BrandLogo size={36} />
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] font-display">TransferLane</h2>
        </button>

        <div className="flex items-center gap-2 md:gap-6">
          {showNav ? (
            <nav className="hidden md:flex items-center gap-6 lg:gap-9">
              <button 
                onClick={() => onCategoryChange?.(BookingCategory.INTERCITY)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t.intercity}
              </button>
              <button 
                onClick={() => onCategoryChange?.(BookingCategory.AIRPORT)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t.airport}
              </button>
            </nav>
          ) : null}

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-surface-dark-lighter text-slate-600 dark:text-text-muted transition-all"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangMenu((v) => !v)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100/70 dark:bg-surface-dark-lighter/40 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-surface-dark-lighter transition-all text-slate-700 dark:text-text-muted"
                aria-label="Change language"
              >
                <span className="material-symbols-outlined text-base">language</span>
                <span className="hidden sm:inline">{language.toUpperCase()}</span>
              </button>
              {showLangMenu ? (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${language === lang ? 'text-primary' : 'text-slate-700 dark:text-text-muted'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {showLoginLink ? (
              <Link
                href={loginHref}
                className="hidden md:inline text-sm font-medium hover:text-primary transition-colors"
              >
                {t.login}
              </Link>
            ) : null}

            {showBookNowButton ? (
              <button 
                onClick={handleBookNow}
                className="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
              >
                <span className="truncate">{t.book}</span>
              </button>
            ) : null}

            <button
              onClick={() => setShowMobileNav((v) => !v)}
              className="md:hidden p-2 text-slate-900 dark:text-white"
              aria-label={showMobileNav ? 'Close menu' : 'Open menu'}
            >
              <span className="material-symbols-outlined">{showMobileNav ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {showMobileNav ? (
        <div className="md:hidden absolute top-full left-0 w-full bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-surface-dark-lighter shadow-2xl">
          <nav className="flex flex-col p-4 gap-2">
            {showNav ? (
              <>
                <button
                  onClick={() => {
                    onCategoryChange?.(BookingCategory.INTERCITY);
                    setShowMobileNav(false);
                  }}
                  className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-lighter/40 font-semibold text-sm text-slate-900 dark:text-white"
                >
                  <span className="material-symbols-outlined text-primary">distance</span>
                  {t.intercity}
                </button>
                <button
                  onClick={() => {
                    onCategoryChange?.(BookingCategory.AIRPORT);
                    setShowMobileNav(false);
                  }}
                  className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-lighter/40 font-semibold text-sm text-slate-900 dark:text-white"
                >
                  <span className="material-symbols-outlined text-primary">flight_takeoff</span>
                  {t.airport}
                </button>
              </>
            ) : null}

            {showLoginLink ? (
              <Link
                href={loginHref}
                onClick={() => setShowMobileNav(false)}
                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-lighter/40 font-semibold text-sm text-slate-900 dark:text-white"
              >
                <span className="material-symbols-outlined text-primary">login</span>
                {t.login}
              </Link>
            ) : null}

            {showBookNowButton ? (
              <button
                onClick={() => {
                  handleBookNow();
                  setShowMobileNav(false);
                }}
                className="mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
              >
                <span className="truncate">{t.book}</span>
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Header;