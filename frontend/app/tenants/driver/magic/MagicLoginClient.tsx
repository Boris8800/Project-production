'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost } from '../../../../lib/api';
import { saveSession, type SessionTokens } from '../../../../lib/session';
import Header from '../../../../components/premium-travel/Header';
import Footer from '../../../../components/premium-travel/Footer';

export default function DriverMagicLoginClient() {
  const tenant = 'driver' as const;
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState<string>('Signing in…');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('Missing token.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tokens = await apiPost<SessionTokens>('/v1/auth/magic-link/consume', { token });
        if (cancelled) return;
        saveSession(tenant, tokens);
        setStatus('Signed in. Redirecting…');
        router.replace('/');
      } catch (e) {
        if (cancelled) return;
        setStatus(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

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

          <div className="relative max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight">
              Driver
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
              Magic link sign-in
            </p>

            <div className="mt-12 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-3xl p-10 shadow-3xl text-left">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">
                    TransferLane Driver
                  </div>
                  <div className="mt-3 text-lg font-black text-slate-900 dark:text-white font-display">
                    {status}
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-200 font-medium leading-relaxed">
                    If you don&apos;t get redirected, return to the Driver login and request a new magic link.
                  </p>
                </div>

                <div className="hidden sm:flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/tenants/driver')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white font-black rounded-2xl transition-colors uppercase tracking-widest text-xs border border-gray-200 dark:border-white/10"
                  >
                    Back to Login
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
                  >
                    Home
                  </button>
                </div>
              </div>

              <div className="mt-8 sm:hidden flex flex-col gap-3">
                <button
                  onClick={() => router.push('/tenants/driver')}
                  className="px-6 py-4 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white font-black rounded-2xl transition-colors uppercase tracking-widest text-xs border border-gray-200 dark:border-white/10"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-4 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}
