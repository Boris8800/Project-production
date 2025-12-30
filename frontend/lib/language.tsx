'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
}

const STORAGE_KEY = 'tl_lang';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  availableLanguages: Language[];
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function normalizeLanguage(value: string | null): Language | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === Language.EN) return Language.EN;
  if (lower === Language.ES) return Language.ES;
  if (lower === Language.FR) return Language.FR;
  if (lower === Language.DE) return Language.DE;
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(Language.EN);

  useEffect(() => {
    try {
      const stored = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
      if (stored) setLanguageState(stored);
    } catch {
      // ignore storage failures
    }
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      availableLanguages: [Language.EN, Language.ES, Language.FR, Language.DE],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
