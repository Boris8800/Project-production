import { Suspense } from 'react';
import DriverMagicLoginClient from './MagicLoginClient';

export default function DriverMagicLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-6">
          <h1 className="text-2xl font-semibold">Driver Panel</h1>
          <p className="mt-2 text-sm text-gray-600">Magic link sign-in</p>
          <p className="mt-6 text-sm">Signing in…</p>
        </main>
      }
    >
      <DriverMagicLoginClient />
    </Suspense>
  );
}
