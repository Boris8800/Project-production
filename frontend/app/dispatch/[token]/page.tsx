import { API_BASE_URL } from '../../../lib/constants';
import DispatchClient from './DispatchClient';

export const dynamic = 'force-dynamic';

async function getInitialSummary(token: string) {
  const res = await fetch(`${API_BASE_URL}/v1/dispatch/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text ? `API ${res.status}: ${text}` : `API ${res.status}`);
  }

  return res.json();
}

export default async function DispatchPage({ params }: { params: { token: string } }) {
  const initialSummary = await getInitialSummary(params.token);
  return <DispatchClient token={params.token} initialSummary={initialSummary} />;
}
