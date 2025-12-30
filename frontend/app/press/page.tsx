'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

type PressItem = {
  title: string;
  outlet: string;
  date: string;
  description: string;
};

export default function PressPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  const items: PressItem[] = useMemo(
    () => [
      {
        title: 'TransferLane expands executive intercity coverage',
        outlet: 'TransferLane Newsroom',
        date: 'May 2024',
        description:
          'New route availability across key UK corridors, with refined dispatch workflows and enhanced passenger experience.',
      },
      {
        title: 'A service-first approach to premium ground travel',
        outlet: 'Industry Brief',
        date: 'April 2024',
        description:
          'How operational consistency, vetted chauffeurs, and fixed transparent pricing raise the standard for private travel.',
      },
      {
        title: 'TransferLane launches concierge-first booking experience',
        outlet: 'Mobility Weekly',
        date: 'March 2024',
        description:
          'A modern booking flow designed for executives, families, and frequent flyers with fast support when it matters.',
      },
    ],
    []
  );

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        onHomeClick={() => router.push('/')}
        showNav={false}
        onBookNowClick={() => router.push('/')}
      />

      <main className="flex-grow">
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-background-dark dark:to-gray-900" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-24 -translate-x-24" />

          <div className="relative max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight">
              Press
            </h1>
            <p className="text-xl text-slate-600 dark:text-text-muted max-w-2xl mx-auto font-medium leading-relaxed">
              Updates, announcements, and stories about TransferLane.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto py-24 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item) => (
              <article
                key={item.title}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-3xl p-10 shadow-3xl"
              >
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">
                  {item.outlet} · {item.date}
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white font-display">
                  {item.title}
                </h2>
                <p className="mt-4 text-slate-600 dark:text-text-muted font-medium leading-relaxed">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16 bg-slate-900 rounded-3xl p-10 text-center shadow-3xl">
            <h2 className="text-3xl font-black text-white mb-4 font-display">Media enquiries</h2>
            <p className="text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              For press requests, please contact our concierge using the details published with your booking confirmation.
            </p>
            <div className="mt-10">
              <button
                onClick={() => router.push('/')}
                className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
              >
                Return Home
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}
