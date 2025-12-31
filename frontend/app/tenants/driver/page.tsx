'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';
import { clearSession, loadSession, saveSession, type SessionTokens } from '../../../lib/session';
import { refreshTenantSession } from '../../../lib/auth';
import Header from '../../../components/premium-travel/Header';
import Footer from '../../../components/premium-travel/Footer';

type Me = { id: string; email?: string; role?: string };

type Trip = {
  id: string;
  bookingId: string;
  driverId: string;
  status: string;
  createdAt?: string;
};

export default function DriverRoot() {
  const tenant = 'driver' as const;
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);
  const [session, setSession] = useState<SessionTokens | null>(null);
  const token = session?.accessToken;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  const [lat, setLat] = useState('51.5074');
  const [lon, setLon] = useState('-0.1278');

  useEffect(() => {
    setSession(loadSession(tenant));
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const canAuth = useMemo(() => email.trim() && password.length >= 8, [email, password]);
  const canMagic = useMemo(() => email.trim().length > 0, [email]);

  async function refreshAll(currentToken: string) {
    try {
      const [meRes, tripsRes] = await Promise.all([
        apiGet<Me>('/v1/auth/me', currentToken),
        apiGet<Trip[]>('/v1/trips', currentToken),
      ]);
      setMe(meRes);
      setTrips(tripsRes);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        const tokens = await refreshTenantSession(tenant);
        setSession(tokens);
        const [meRes, tripsRes] = await Promise.all([
          apiGet<Me>('/v1/auth/me', tokens.accessToken),
          apiGet<Trip[]>('/v1/trips', tokens.accessToken),
        ]);
        setMe(meRes);
        setTrips(tripsRes);
        return;
      }
      throw e;
    }
  }

  async function login() {
    setStatus(null);
    try {
      const tokens = await apiPost<SessionTokens>('/v1/auth/login', { email, password });
      saveSession(tenant, tokens);
      setSession(tokens);
      await refreshAll(tokens.accessToken);
      setStatus('Signed in.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function requestMagicLink() {
    setStatus(null);
    try {
      const res = await apiPost<{ ok: boolean; message: string; link?: string }>(
        '/v1/auth/magic-link',
        { email, tenant },
      );
      setStatus(res.link ? `${res.message} Link: ${res.link}` : res.message);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function logout() {
    clearSession(tenant);
    setSession(null);
    setMe(null);
    setTrips([]);
  }

  async function refresh() {
    if (!token) return;
    setStatus(null);
    try {
      await refreshAll(token);
      setStatus('Refreshed.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function sendLocation() {
    if (!token) return;
    setStatus(null);
    try {
      await apiPost('/v1/drivers/location', { lat: Number(lat), lon: Number(lon) }, token);
      setStatus('Location sent.');
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        try {
          const tokens = await refreshTenantSession(tenant);
          setSession(tokens);
          await apiPost('/v1/drivers/location', { lat: Number(lat), lon: Number(lon) }, tokens.accessToken);
          setStatus('Location sent.');
          return;
        } catch (e2) {
          setStatus(e2 instanceof Error ? e2.message : String(e2));
          return;
        }
      }
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function tripAction(tripId: string, action: 'accept' | 'start' | 'complete') {
    if (!token) return;
    setStatus(null);
    try {
      await apiPost(`/v1/trips/${tripId}/${action}`, {}, token);
      await refreshAll(token);
      setStatus(`Trip ${action} ok.`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        try {
          const tokens = await refreshTenantSession(tenant);
          setSession(tokens);
          await apiPost(`/v1/trips/${tripId}/${action}`, {}, tokens.accessToken);
          await refreshAll(tokens.accessToken);
          setStatus(`Trip ${action} ok.`);
          return;
        } catch (e2) {
          setStatus(e2 instanceof Error ? e2.message : String(e2));
          return;
        }
      }
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        onHomeClick={() => router.push('/')}
        showNav={false}
        showLoginLink={false}
        showBookNowButton={false}
      />

      <main className="flex-grow">
        <section className="relative w-full flex items-center justify-center py-16 px-4 md:px-12 overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[30s] scale-110"
            style={{
              backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.6), rgba(12, 11, 9, 0.92)), url('https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&q=85&w=2400')`,
              backgroundAttachment: 'fixed',
            }}
          />

          <div className="relative z-10 w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-md">
                <span className="material-symbols-outlined text-primary text-sm">local_taxi</span>
                <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Driver Access</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-[0.9] tracking-tighter">
                Driver Portal<br />
                <span className="text-primary italic font-display">Go Live With Confidence</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Sign in to receive trips and update your live location.
              </p>
            </div>

            <div className="w-full bg-white dark:bg-surface-dark/95 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-white/10">
              {status ? (
                <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                  {status}
                </div>
              ) : null}

              {!token ? (
                <section className="grid gap-6 max-w-2xl mx-auto">
                  <div className="grid gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-200">
                      Email
                    </label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl">mail</span>
                      <input
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="driver@example.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-200">
                      Password
                    </label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl">key</span>
                      <input
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        type="password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      className="px-8 py-4 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50"
                      onClick={login}
                      disabled={!canAuth}
                    >
                      Login
                    </button>
                    <button
                      className="px-8 py-4 rounded-[20px] border-2 border-primary/30 bg-primary/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:bg-primary/15 transition-all disabled:opacity-50"
                      onClick={requestMagicLink}
                      disabled={!canMagic}
                    >
                      Magic Link
                    </button>
                  </div>
                </section>
              ) : (
                <section className="grid gap-10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Signed in as <span className="text-slate-900 dark:text-white">{me?.email ?? '(unknown)'}</span>{' '}
                      {me?.role ? <span className="text-slate-700 dark:text-slate-200">({me.role})</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="px-6 py-3 rounded-[16px] border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:border-primary/50 transition-all"
                        onClick={refresh}
                      >
                        Refresh
                      </button>
                      <button
                        className="px-6 py-3 rounded-[16px] bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                        onClick={logout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      Location
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="Latitude"
                      />
                      <input
                        className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                        placeholder="Longitude"
                      />
                    </div>
                    <button
                      className="px-8 py-4 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all w-fit"
                      onClick={sendLocation}
                    >
                      Send location
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      My trips
                    </h2>
                    {trips.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-200 font-medium">No trips assigned yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {trips.map((t) => (
                          <div
                            key={t.id}
                            className="p-6 rounded-[28px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{t.id}</div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.status}</div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                className="px-6 py-3 rounded-[16px] border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:border-primary/50 transition-all"
                                onClick={() => tripAction(t.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                className="px-6 py-3 rounded-[16px] border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:border-primary/50 transition-all"
                                onClick={() => tripAction(t.id, 'start')}
                              >
                                Start
                              </button>
                              <button
                                className="px-6 py-3 rounded-[16px] bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                onClick={() => tripAction(t.id, 'complete')}
                              >
                                Complete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}
