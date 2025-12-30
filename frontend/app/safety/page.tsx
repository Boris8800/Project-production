'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

const safetyHighlights = [
  {
    title: 'Vetted Chauffeurs',
    description:
      'All chauffeurs complete identity verification, right-to-work checks, and ongoing performance reviews.',
  },
  {
    title: 'Vehicle Standards',
    description:
      'Our fleet is maintained to executive standards with routine inspections and preventative servicing schedules.',
  },
  {
    title: 'Live Trip Oversight',
    description:
      'We monitor trips operationally so we can respond quickly if a route disruption or unexpected issue occurs.',
  },
  {
    title: 'Secure Payments',
    description:
      'Payments are handled via encrypted gateways; we do not expose sensitive card information in our systems.',
  },
];

export default function SafetyPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

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
              Safety
            </h1>
            <p className="text-xl text-slate-600 dark:text-text-muted max-w-2xl mx-auto font-medium leading-relaxed">
              Safety is not a feature — it&apos;s a standard. TransferLane is built around professional chauffeurs, operational discipline, and clear passenger support.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto py-24 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {safetyHighlights.map((item) => (
              <div
                key={item.title}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-3xl p-10 shadow-3xl"
              >
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-display">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-text-muted font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-slate-900 rounded-3xl p-10 text-center shadow-3xl">
            <h2 className="text-3xl font-black text-white mb-4 font-display">Need help during a trip?</h2>
            <p className="text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              For urgent issues, contact our concierge using the details provided in your booking confirmation. For general questions, visit the Help Center.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/help')}
                className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
              >
                Help Center
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-colors uppercase tracking-widest text-xs"
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
