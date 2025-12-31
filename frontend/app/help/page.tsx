'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

type FaqItem = {
  question: string;
  answer: string;
};

export default function HelpPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        question: 'How do I book a transfer?',
        answer:
          'Use the booking flow on the homepage. Choose your route, vehicle, pickup time, and passenger details. You will receive confirmation once payment is completed.',
      },
      {
        question: 'Do you offer airport meet & greet?',
        answer:
          'Yes. Standard meet & greet is included unless otherwise specified. Your chauffeur will follow the instructions in your booking confirmation.',
      },
      {
        question: 'What if my flight is delayed?',
        answer:
          'If you provided flight details, we monitor arrival information. If anything changes, contact our concierge to confirm adjustments when needed.',
      },
      {
        question: 'Can I change or cancel my booking?',
        answer:
          'Changes and cancellations depend on notice time and availability. Please review the cancellation policy in our Terms of Service and contact support for assistance.',
      },
      {
        question: 'Is pricing fixed?',
        answer:
          'Quotes provided through the web app are fixed fares and typically include tolls and congestion charges unless explicitly noted.',
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
        <section className="py-24 px-6 border-b border-gray-100 dark:border-white/5 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight">
            Help Center
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Answers to common questions about bookings, pickups, and service standards.
          </p>
        </section>

        <section className="max-w-5xl mx-auto py-24 px-6">
          <div className="grid grid-cols-1 gap-6">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-3xl"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-display">
                      {item.question}
                    </h3>
                    <span className="text-slate-400 dark:text-white/50 font-black group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </div>
                </summary>
                <div className="mt-4 text-slate-600 dark:text-slate-200 font-medium leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-16 bg-slate-900 rounded-3xl p-10 text-center shadow-3xl">
            <h2 className="text-3xl font-black text-white mb-4 font-display">Still need assistance?</h2>
            <p className="text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              If your question is not covered here, contact our concierge using the details in your booking confirmation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/terms')}
                className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-colors uppercase tracking-widest text-xs"
              >
                View Terms
              </button>
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
