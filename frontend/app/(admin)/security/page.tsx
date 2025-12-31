'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  success: boolean;
  timestamp: string;
  userAgent?: string;
}

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string | null;
  attemptsCount: number;
  isManual: boolean;
}

interface OnlineUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lastSeen: string;
  isOnline: boolean;
}

interface LoginStats {
  totalAttempts: number;
  successfulLogins: number;
  failedAttempts: number;
  uniqueIPs: number;
  uniqueUsers: number;
  byDay: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
  }>;
}

export default function SecurityMonitoringPage() {
  const router = useRouter();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [blockIpInput, setBlockIpInput] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('60');

  const loadData = useCallback(async () => {
    try {
      setError('');
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/tenants/admin');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch login attempts
      const attemptsRes = await fetch(`${apiUrl}/security/login-attempts?limit=50`, { headers });
      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setLoginAttempts(attemptsData);
      }

      // Fetch stats
      const statsRes = await fetch(`${apiUrl}/security/login-attempts/stats?days=7`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch blocked IPs
      const blockedRes = await fetch(`${apiUrl}/security/blocked-ips`, { headers });
      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        setBlockedIPs(blockedData);
      }

      // Fetch online users
      const onlineRes = await fetch(`${apiUrl}/security/online-users`, { headers });
      if (onlineRes.ok) {
        const onlineData = await onlineRes.json();
        setOnlineUsers(onlineData);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void loadData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const blockIP = async () => {
    if (!blockIpInput.trim()) {
      alert('Please enter an IP address');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/security/block-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ip: blockIpInput,
          reason: blockReason || 'Manual block by administrator',
          duration: parseInt(blockDuration, 10),
        }),
      });

      if (res.ok) {
        alert(`IP ${blockIpInput} has been blocked`);
        setBlockIpInput('');
        setBlockReason('');
        loadData();
      } else {
        const error = await res.text();
        alert(`Failed to block IP: ${error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const unblockIP = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock IP ${ip}?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/security/block-ip/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert(`IP ${ip} has been unblocked`);
        loadData();
      } else {
        const error = await res.text();
        alert(`Failed to unblock IP: ${error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading security data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 px-6 py-2 rounded-full mb-6">
            <span className="text-[11px] font-black text-red-400 tracking-[0.2em] uppercase">Security Center</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-[0.9] tracking-tighter">
            Security Monitoring
            <br />
            <span className="text-red-400 italic font-display">Real-time Protection</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-bold">Auto-refresh (10s)</span>
            </label>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl text-white">
            {error}
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <div className="text-4xl font-black text-white mb-2">{stats.totalAttempts}</div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total Attempts</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-xl rounded-3xl p-6 border border-green-500/30">
              <div className="text-4xl font-black text-white mb-2">{stats.successfulLogins}</div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Successful</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-xl rounded-3xl p-6 border border-red-500/30">
              <div className="text-4xl font-black text-white mb-2">{stats.failedAttempts}</div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Failed</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30">
              <div className="text-4xl font-black text-white mb-2">{stats.uniqueIPs}</div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Unique IPs</div>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30">
              <div className="text-4xl font-black text-white mb-2">{onlineUsers.filter(u => u.isOnline).length}</div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Online Now</div>
            </div>
          </div>
        )}

        {/* Online Users */}
        <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Online Users ({onlineUsers.filter(u => u.isOnline).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineUsers.filter(u => u.isOnline).map((user) => (
              <div key={user.id} className="bg-white/5 rounded-2xl p-4 border border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold">{user.name}</div>
                    <div className="text-slate-400 text-xs">{user.email}</div>
                    <div className="text-green-400 text-xs font-bold">{user.role}</div>
                  </div>
                  <div className="text-slate-400 text-xs">{formatTimeAgo(user.lastSeen)}</div>
                </div>
              </div>
            ))}
          </div>
          {onlineUsers.filter(u => u.isOnline).length === 0 && (
            <div className="text-center text-slate-400 py-8">No users currently online</div>
          )}
        </div>

        {/* Manual IP Blocking */}
        <div className="mb-8 bg-red-500/10 backdrop-blur-xl rounded-3xl p-6 border border-red-500/30">
          <h2 className="text-2xl font-black text-white mb-6">🚫 Block IP Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={blockIpInput}
              onChange={(e) => setBlockIpInput(e.target.value)}
              placeholder="IP Address (e.g., 192.168.1.100)"
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 font-mono"
            />
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (optional)"
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400"
            />
            <select
              value={blockDuration}
              onChange={(e) => setBlockDuration(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="360">6 hours</option>
              <option value="1440">24 hours</option>
              <option value="10080">7 days</option>
            </select>
            <button
              onClick={blockIP}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
            >
              🔒 Block IP
            </button>
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6">Blocked IP Addresses ({blockedIPs.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Reason</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Blocked At</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Expires</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((block) => (
                  <tr key={block.ip} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4 text-white font-mono text-sm">{block.ip}</td>
                    <td className="py-4 px-4 text-slate-300 text-sm">{block.reason}</td>
                    <td className="py-4 px-4 text-slate-400 text-xs">{formatDate(block.blockedAt)}</td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {block.expiresAt ? formatDate(block.expiresAt) : 'Never'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${block.isManual ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                        {block.isManual ? 'Manual' : 'Auto'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => unblockIP(block.ip)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white text-xs font-bold transition-all"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {blockedIPs.length === 0 && (
              <div className="text-center text-slate-400 py-8">No IPs currently blocked</div>
            )}
          </div>
        </div>

        {/* Login Attempts */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6">Recent Login Attempts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">User Agent</th>
                  <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loginAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${attempt.success ? 'bg-green-500' : 'bg-red-500'}`}>
                        {attempt.success ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white text-sm">{attempt.email}</td>
                    <td className="py-4 px-4 text-white font-mono text-sm">{attempt.ip}</td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {formatDate(attempt.timestamp)}
                      <div className="text-slate-500">{formatTimeAgo(attempt.timestamp)}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {attempt.userAgent || 'Unknown'}
                    </td>
                    <td className="py-4 px-4">
                      {!attempt.success && (
                        <button
                          onClick={() => {
                            setBlockIpInput(attempt.ip);
                            setBlockReason(`Multiple failed attempts for ${attempt.email}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-xs font-bold transition-all"
                        >
                          Block This IP
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loginAttempts.length === 0 && (
              <div className="text-center text-slate-400 py-8">No login attempts recorded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
