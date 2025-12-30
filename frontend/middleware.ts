import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function tenantFromHost(host: string) {
  const h = host.toLowerCase();
  if (h.startsWith('driver.')) return 'driver' as const;
  if (h.startsWith('admin.')) return 'admin' as const;
  return null;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Skip Next internals
  if (url.pathname.startsWith('/_next') || url.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // If user explicitly hits /tenants/*, don't rewrite again.
  if (url.pathname.startsWith('/tenants/')) {
    return NextResponse.next();
  }

  const host = req.headers.get('host') ?? '';
  const tenant = tenantFromHost(host);
  if (!tenant) {
    // Main site stays public (no tenant prefix).
    return NextResponse.next();
  }

  // Rewrite to per-tenant route tree (subdomains only)
  url.pathname = `/tenants/${tenant}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json).*)'],
};
