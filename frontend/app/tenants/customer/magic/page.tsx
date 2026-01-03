import { Suspense } from 'react';
import CustomerMagicLoginClient from './MagicLoginClient';

export default function CustomerMagicLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-6">
          <div className="w-full max-w-xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-3xl p-10 shadow-3xl text-center">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">Transferline</div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-display">
              Magic link sign-in
            </h1>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-200 font-medium">Signing in…</p>
          </div>
        </main>
      }
    >
      <CustomerMagicLoginClient />
    </Suspense>
  );
}
