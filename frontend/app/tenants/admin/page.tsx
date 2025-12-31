'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';
import { clearSession, loadSession, saveSession, type SessionTokens } from '../../../lib/session';
import { refreshTenantSession } from '../../../lib/auth';
import Header from '../../../components/premium-travel/Header';
import Footer from '../../../components/premium-travel/Footer';

type Me = { id: string; email?: string; role?: string };

type User = {
  id: string;
  email: string | null;
  role: string;
  status: string;
  createdAt?: string;
};

type Booking = {
  id: string;
  bookingNumber?: string | null;
  customerId: string;
  assignedDriverId: string | null;
  status: string;
  createdAt?: string;
};

export default function AdminRoot() {
  const tenant = 'admin' as const;
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);
  const [session, setSession] = useState<SessionTokens | null>(null);
  const token = session?.accessToken;

  const [status, setStatus] = useState<string | null>(null);

  // bootstrap
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');

  // login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // create user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Driver' | 'Admin'>('Driver');

  // dispatch
  const [dispatchBookingId, setDispatchBookingId] = useState('');
  const [dispatchDriverId, setDispatchDriverId] = useState('');

  const [me, setMe] = useState<Me | null>(null);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setSession(loadSession(tenant));
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const canLogin = useMemo(() => email.trim() && password.length >= 8, [email, password]);
  const canMagic = useMemo(() => email.trim().length > 0, [email]);

  async function refreshAll(currentToken: string) {
    try {
      const [meRes, driversRes, bookingsRes] = await Promise.all([
        apiGet<Me>('/v1/auth/me', currentToken),
        apiGet<User[]>('/v1/admin/drivers', currentToken),
        apiGet<Booking[]>('/v1/admin/bookings', currentToken),
      ]);
      setMe(meRes);
      setDrivers(driversRes);
      setBookings(bookingsRes);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        const tokens = await refreshTenantSession(tenant);
        setSession(tokens);
        const [meRes, driversRes, bookingsRes] = await Promise.all([
          apiGet<Me>('/v1/auth/me', tokens.accessToken),
          apiGet<User[]>('/v1/admin/drivers', tokens.accessToken),
          apiGet<Booking[]>('/v1/admin/bookings', tokens.accessToken),
        ]);
        setMe(meRes);
        setDrivers(driversRes);
        setBookings(bookingsRes);
        return;
      }
      throw e;
    }
  }

  async function bootstrap() {
    setStatus(null);
    try {
      await apiPost('/v1/admin/bootstrap', {
        token: bootstrapToken,
        email: bootstrapEmail,
        password: bootstrapPassword,
      });
      setStatus('Superadmin bootstrapped. Now login.');
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
    setDrivers([]);
    setBookings([]);
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

  async function createUser() {
    if (!token) return;
    setStatus(null);
    try {
      await apiPost(
        '/v1/admin/users',
        {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole === 'Driver' ? 'driver' : 'admin',
        },
        token,
      );
      await refreshAll(token);
      setStatus('User created.');
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        try {
          const tokens = await refreshTenantSession(tenant);
          setSession(tokens);
          await apiPost(
            '/v1/admin/users',
            {
              email: newUserEmail,
              password: newUserPassword,
              role: newUserRole === 'Driver' ? 'driver' : 'admin',
            },
            tokens.accessToken,
          );
          await refreshAll(tokens.accessToken);
          setStatus('User created.');
          return;
        } catch (e2) {
          setStatus(e2 instanceof Error ? e2.message : String(e2));
          return;
        }
      }
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function dispatch() {
    if (!token) return;
    setStatus(null);
    try {
      await apiPost(`/v1/trips/dispatch/${dispatchBookingId}/assign-driver`, { driverId: dispatchDriverId }, token);
      await refreshAll(token);
      setStatus('Driver assigned.');
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('API 401')) {
        try {
          const tokens = await refreshTenantSession(tenant);
          setSession(tokens);
          await apiPost(
            `/v1/trips/dispatch/${dispatchBookingId}/assign-driver`,
            { driverId: dispatchDriverId },
            tokens.accessToken,
          );
          await refreshAll(tokens.accessToken);
          setStatus('Driver assigned.');
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
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] scale-105"
            style={{
              backgroundImage: `linear-gradient(rgba(10, 10, 20, 0.75), rgba(10, 10, 20, 0.98)), url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400')`,
            }}
          />

          <div className="relative z-10 w-full max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-md">
                <span className="material-symbols-outlined text-primary text-sm">admin_panel_settings</span>
                <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Admin Access</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-[0.9] tracking-tighter">
                Administration<br />
                <span className="text-primary italic font-display">Secure Operations</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
                Bootstrap once, then sign in to manage users, dispatch, and monitor bookings.
              </p>
            </div>

            <div className="w-full bg-white dark:bg-surface-dark/95 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-white/10">
              {status ? (
                <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                  {status}
                </div>
              ) : null}

              <section className="grid gap-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">security</span>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bootstrap (first-time only)</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                      value={bootstrapToken}
                      onChange={(e) => setBootstrapToken(e.target.value)}
                      placeholder="BOOTSTRAP_TOKEN"
                    />
                    <input
                      className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                      value={bootstrapEmail}
                      onChange={(e) => setBootstrapEmail(e.target.value)}
                      type="email"
                      placeholder="Email"
                    />
                    <input
                      className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                      value={bootstrapPassword}
                      onChange={(e) => setBootstrapPassword(e.target.value)}
                      type="password"
                      placeholder="Password"
                    />
                  </div>
                  <button
                    className="px-8 py-4 rounded-[20px] border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:border-primary/50 hover:text-primary transition-all w-fit"
                    onClick={bootstrap}
                  >
                    Bootstrap superadmin
                  </button>
                </div>

                {!token ? (
                  <section className="grid gap-6 max-w-3xl">
                    <div className="flex items-center gap-3 mt-6">
                      <span className="material-symbols-outlined text-primary">login</span>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Login</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email"
                      />
                      <input
                        className="w-full px-6 py-5 rounded-[24px] bg-slate-100 dark:bg-background-dark/60 border-2 border-slate-200 dark:border-transparent focus:border-primary/40 text-base font-bold transition-all outline-none text-slate-900 dark:text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Password"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        className="px-8 py-4 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50"
                        onClick={login}
                        disabled={!canLogin}
                      >
                        Login
                      </button>
                      <button
                        className="px-8 py-4 rounded-[20px] border-2 border-primary/30 bg-primary/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs hover:bg-primary/15 transition-all disabled:opacity-50"
                        onClick={requestMagicLink}
                        disabled={!canMagic}
                      >
                        Magic link
                      </button>
                    </div>
                  </section>
                ) : (
                  <section className="grid gap-10 mt-6">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="grid gap-4 p-6 rounded-[32px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Create user</h2>
                        <input
                          className="w-full px-5 py-4 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 focus:border-primary/40 outline-none font-bold text-slate-900 dark:text-white"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="email"
                        />
                        <input
                          className="w-full px-5 py-4 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 focus:border-primary/40 outline-none font-bold text-slate-900 dark:text-white"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="password (min 8 chars)"
                          type="password"
                        />
                        <select
                          className="w-full px-5 py-4 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 focus:border-primary/40 outline-none font-bold text-slate-900 dark:text-white"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'Driver' | 'Admin')}
                        >
                          <option value="Driver">Driver</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button
                          className="px-8 py-4 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all w-fit"
                          onClick={createUser}
                        >
                          Create
                        </button>
                      </div>

                      <div className="grid gap-4 p-6 rounded-[32px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Dispatch</h2>
                        <input
                          className="w-full px-5 py-4 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 focus:border-primary/40 outline-none font-bold text-slate-900 dark:text-white"
                          value={dispatchBookingId}
                          onChange={(e) => setDispatchBookingId(e.target.value)}
                          placeholder="bookingId"
                        />
                        <input
                          className="w-full px-5 py-4 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 focus:border-primary/40 outline-none font-bold text-slate-900 dark:text-white"
                          value={dispatchDriverId}
                          onChange={(e) => setDispatchDriverId(e.target.value)}
                          placeholder="driverId"
                        />
                        <button
                          className="px-8 py-4 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all w-fit"
                          onClick={dispatch}
                        >
                          Assign driver
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="grid gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Drivers</h2>
                        {drivers.length === 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-200 font-medium">No drivers.</p>
                        ) : (
                          <div className="grid gap-3">
                            {drivers.map((d) => (
                              <div
                                key={d.id}
                                className="p-6 rounded-[28px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10"
                              >
                                <div className="text-sm font-black text-slate-900 dark:text-white">{d.id}</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-200 font-medium">
                                  {d.email ?? '(no email)'} | {d.role} | {d.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Bookings</h2>
                        {bookings.length === 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-200 font-medium">No bookings.</p>
                        ) : (
                          <div className="grid gap-3">
                            {bookings.map((b) => (
                              <div
                                key={b.id}
                                className="p-6 rounded-[28px] bg-slate-50 dark:bg-background-dark/40 border border-slate-200 dark:border-white/10"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div className="text-sm font-black text-slate-900 dark:text-white">
                                    {b.bookingNumber || b.id}
                                  </div>
                                  <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">{b.status}</div>
                                </div>
                                <div className="mt-3 text-sm text-slate-600 dark:text-slate-200 font-medium">Customer: {b.customerId}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-200 font-medium">Driver: {b.assignedDriverId ?? '-'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}
