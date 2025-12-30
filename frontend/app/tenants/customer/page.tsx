'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';
import { clearSession, loadSession, saveSession, type SessionTokens } from '../../../lib/session';
import { refreshTenantSession } from '../../../lib/auth';
import Header from '../../../components/premium-travel/Header';
import Footer from '../../../components/premium-travel/Footer';

type Me = { id: string; email?: string; role?: string };

type Booking = {
  id: string;
  status: string;
  createdAt?: string;
  location?: {
    pickupAddress: string;
    dropoffAddress: string;
  } | null;
};

export default function CustomerRoot() {
  const tenant = 'customer' as const;
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);
  const [session, setSession] = useState<SessionTokens | null>(null);
  const token = session?.accessToken;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('51.5074');
  const [pickupLon, setPickupLon] = useState('-0.1278');
  const [dropoffLat, setDropoffLat] = useState('51.5155');
  const [dropoffLon, setDropoffLon] = useState('-0.1419');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSession(loadSession(tenant));
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const canAuth = useMemo(() => email.trim() && password.length >= 8, [email, password]);
  const canMagic = useMemo(() => email.trim().length > 0, [email]);

  async function refreshMeAndBookings(currentToken: string) {
    try {
      const [meRes, bookingsRes] = await Promise.all([
        apiGet<Me>('/v1/auth/me', currentToken),
        apiGet<Booking[]>('/v1/bookings', currentToken),
      ]);
      setMe(meRes);
      setBookings(bookingsRes);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        const tokens = await refreshTenantSession(tenant);
        setSession(tokens);
        const [meRes, bookingsRes] = await Promise.all([
          apiGet<Me>('/v1/auth/me', tokens.accessToken),
          apiGet<Booking[]>('/v1/bookings', tokens.accessToken),
        ]);
        setMe(meRes);
        setBookings(bookingsRes);
        return;
      }
      throw e;
    }
  }

  async function register() {
    setStatus(null);
    try {
      const tokens = await apiPost<SessionTokens>('/v1/auth/register', { email, password });
      saveSession(tenant, tokens);
      setSession(tokens);
      await refreshMeAndBookings(tokens.accessToken);
      setStatus('Registered and signed in.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function login() {
    setStatus(null);
    try {
      const tokens = await apiPost<SessionTokens>('/v1/auth/login', { email, password });
      saveSession(tenant, tokens);
      setSession(tokens);
      await refreshMeAndBookings(tokens.accessToken);
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
    setBookings([]);
  }

  async function createBooking() {
    if (!token) return;
    setStatus(null);

    try {
      const created = await apiPost<Booking>(
        '/v1/bookings',
        {
          pickupAddress,
          dropoffAddress,
          pickupLat: Number(pickupLat),
          pickupLon: Number(pickupLon),
          dropoffLat: Number(dropoffLat),
          dropoffLon: Number(dropoffLon),
          notes: notes || undefined,
        },
        token,
      );
      setStatus(`Booking created: ${created.id}`);
      await refreshMeAndBookings(token);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        try {
          const tokens = await refreshTenantSession(tenant);
          setSession(tokens);
          const created = await apiPost<Booking>(
            '/v1/bookings',
            {
              pickupAddress,
              dropoffAddress,
              pickupLat: Number(pickupLat),
              pickupLon: Number(pickupLon),
              dropoffLat: Number(dropoffLat),
              dropoffLon: Number(dropoffLon),
              notes: notes || undefined,
            },
            tokens.accessToken,
          );
          setStatus(`Booking created: ${created.id}`);
          await refreshMeAndBookings(tokens.accessToken);
          return;
        } catch (e2) {
          setStatus(e2 instanceof Error ? e2.message : String(e2));
          return;
        }
      }
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function refresh() {
    if (!token) return;
    setStatus(null);
    try {
      await refreshMeAndBookings(token);
      setStatus('Refreshed.');
    } catch (e) {
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
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] scale-105"
            style={{
              backgroundImage: `linear-gradient(rgba(10, 10, 20, 0.75), rgba(10, 10, 20, 0.98)), url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400')`,
            }}
          />

          <div className="relative z-10 w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-md">
                <span className="material-symbols-outlined text-primary text-sm">lock</span>
                <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Customer Access</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-[0.9] tracking-tighter">
                Welcome Back<br />
                <span className="text-primary italic font-display">Sign In Securely</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Use your password or request a magic link. Your booking history and account details are protected.
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
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-text-muted">
                      Email
                    </label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-xl">mail</span>
                      <input
                        className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-text-muted">
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
                    <p className="text-xs text-slate-500 dark:text-text-muted font-medium">
                      Password is required for register/login. Magic link only needs email.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      className="px-8 py-4 rounded-[20px] border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                      onClick={register}
                      disabled={!canAuth}
                    >
                      Register
                    </button>
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
                    <div className="text-sm font-bold text-slate-700 dark:text-text-muted">
                      Signed in as <span className="text-slate-900 dark:text-white">{me?.email ?? '(unknown)'}</span>{' '}
                      {me?.role ? <span className="text-slate-700 dark:text-text-muted">({me.role})</span> : null}
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
                      Create booking
                    </h2>

                    <div className="grid gap-4">
                      <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-2xl">my_location</span>
                        <input
                          className="w-full pl-16 pr-8 py-6 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-lg font-bold transition-all outline-none text-slate-900 dark:text-white"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Collection Address"
                        />
                      </div>

                      <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-2xl">location_on</span>
                        <input
                          className="w-full pl-16 pr-8 py-6 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-lg font-bold transition-all outline-none text-slate-900 dark:text-white"
                          value={dropoffAddress}
                          onChange={(e) => setDropoffAddress(e.target.value)}
                          placeholder="Destination Address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-text-muted">
                            Pickup (Lat/Lon)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="w-full px-4 py-4 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                              value={pickupLat}
                              onChange={(e) => setPickupLat(e.target.value)}
                              placeholder="Lat"
                            />
                            <input
                              className="w-full px-4 py-4 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                              value={pickupLon}
                              onChange={(e) => setPickupLon(e.target.value)}
                              placeholder="Lon"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-text-muted">
                            Dropoff (Lat/Lon)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="w-full px-4 py-4 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                              value={dropoffLat}
                              onChange={(e) => setDropoffLat(e.target.value)}
                              placeholder="Lat"
                            />
                            <input
                              className="w-full px-4 py-4 rounded-[20px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                              value={dropoffLon}
                              onChange={(e) => setDropoffLon(e.target.value)}
                              placeholder="Lon"
                            />
                          </div>
                        </div>
                      </div>

                      <textarea
                        className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={3}
                      />

                      <button
                        className="group relative w-full overflow-hidden p-6 bg-primary text-white font-black text-lg rounded-[24px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform active:scale-[0.98] disabled:opacity-50"
                        onClick={createBooking}
                        disabled={!pickupAddress.trim() || !dropoffAddress.trim()}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <span>Submit booking</span>
                          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      My bookings
                    </h2>
                    {bookings.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-text-muted font-medium">No bookings yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {bookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-6 rounded-[28px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{b.id}</div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">{b.status}</div>
                            </div>
                            {b.location ? (
                              <div className="mt-3 text-sm text-slate-600 dark:text-text-muted font-medium">
                                {b.location.pickupAddress} → {b.location.dropoffAddress}
                              </div>
                            ) : null}
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
