'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

export default function TermsPage() {
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
        <div className="py-20 px-6 border-b border-gray-100 dark:border-white/5 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight">
            Terms of Service
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto font-medium">Last updated: May 24, 2024</p>
        </div>

        <div className="max-w-4xl mx-auto py-24 px-6 md:px-12 space-y-16">
          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">1. Acceptance of Terms</h2>
            <div className="text-slate-600 dark:text-text-muted leading-relaxed space-y-4 text-sm font-medium">
              <p>
                By accessing and using TransferLane (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must refrain from using our chauffeur and intercity travel services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">2. Service Provision</h2>
            <div className="text-slate-600 dark:text-text-muted leading-relaxed space-y-4 text-sm font-medium">
              <p>
                TransferLane provides executive private transportation services across the United Kingdom. We reserve the right to modify or discontinue any aspect of the service at any time without prior notice.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>All bookings are subject to vehicle and chauffeur availability.</li>
                <li>Routes are planned using advanced real-time traffic data, but arrival times are estimates.</li>
                <li>We maintain a strict no-smoking and no-illegal-substance policy in all vehicles.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">3. Pricing and Payments</h2>
            <div className="text-slate-600 dark:text-text-muted leading-relaxed space-y-4 text-sm font-medium">
              <p>
                Quotes provided via our web application are fixed fares. These include all tolls, congestion charges, and standard meet &amp; greet services unless otherwise specified.
              </p>
              <p>
                Payments are processed securely via our encrypted payment gateways. For intercity travels, a full payment or deposit may be required at the time of booking confirmation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">4. Cancellation Policy</h2>
            <div className="text-slate-600 dark:text-text-muted leading-relaxed space-y-4 text-sm font-medium">
              <p>We understand that schedules change. To maintain our chauffeur availability, the following cancellation terms apply:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Cancellations more than 24 hours before pickup: Full refund.</li>
                <li>Cancellations between 12 and 24 hours: 50% refund.</li>
                <li>Cancellations less than 12 hours before pickup: Non-refundable.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">5. Liability</h2>
            <div className="text-slate-600 dark:text-text-muted leading-relaxed space-y-4 text-sm font-medium">
              <p>
                TransferLane holds comprehensive commercial insurance for all vehicles and passengers. However, we are not liable for delays caused by circumstances beyond our control (force majeure), including extreme weather, road closures, or industrial action.
              </p>
            </div>
          </section>

          <div className="pt-12 border-t border-gray-100 dark:border-white/5 flex flex-col items-center">
            <p className="text-sm text-text-muted mb-8 italic">
              If you have questions regarding these terms, please contact our concierge.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
            >
              I Understand &amp; Return Home
            </button>
          </div>
        </div>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}
