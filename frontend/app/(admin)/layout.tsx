'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/tenants/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/(admin)/trips', label: 'Trip Management', icon: '🚗' },
    { href: '/(admin)/security', label: 'Security', icon: '🔒' },
    { href: '/(admin)/drivers', label: 'Drivers', icon: '👨‍✈️' },
    { href: '/(admin)/analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">Project</span>
              <span className="text-sm font-bold text-white/60 uppercase tracking-wider">Admin Panel</span>
            </div>
            
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    pathname === item.href
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm font-bold">Ken</span>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  window.location.href = '/tenants/admin';
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold uppercase tracking-wider transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-xl border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">
              © 2025 Project Admin. All rights reserved.
            </p>
            <p className="text-white/40 text-sm font-mono">
              v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
