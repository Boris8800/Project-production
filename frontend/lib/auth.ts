import { apiPost } from './api';
import { clearSession, loadSession, saveSession, type SessionTokens } from './session';

export type Tenant = 'customer' | 'driver' | 'admin';

export async function refreshTenantSession(tenant: Tenant): Promise<SessionTokens> {
  const session = loadSession(tenant);
  if (!session?.refreshToken) {
    clearSession(tenant);
    throw new Error('Missing session refresh token');
  }

  try {
    const tokens = await apiPost<SessionTokens>('/v1/auth/refresh', { refreshToken: session.refreshToken });
    saveSession(tenant, tokens);
    return tokens;
  } catch (e) {
    clearSession(tenant);
    throw e;
  }
}
