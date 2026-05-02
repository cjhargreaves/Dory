'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ApiKeys({ userId }: { userId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/keys?user_id=${userId}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setKeys((await res.json()).keys);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [userId]);

  async function createKey() {
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_URL}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setNewKey(data.key);
      setName('');
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      await fetch(`${API_URL}/api/keys/${id}?user_id=${userId}`, { method: 'DELETE' });
      setKeys(k => k.filter(key => key.id !== id));
    } finally {
      setRevoking(null);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mb-10">
      <div className="bg-brand-panel rounded-xl border border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest">API KEYS</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setCreateError(null); }}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="Key name…"
              className="bg-brand-dark/60 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-cyan/40 w-44"
            />
            <button
              onClick={createKey}
              disabled={creating || !name.trim()}
              className="px-3 py-1.5 text-sm bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/20 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {creating ? 'Creating…' : 'Create key'}
            </button>
          </div>
        </div>

        {/* Create error */}
        {createError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {createError}
          </div>
        )}

        {/* New key reveal */}
        {newKey && (
          <div className="mx-6 my-4 rounded-lg border border-brand-cyan/20 bg-brand-dark/60 p-4">
            <p className="text-xs text-brand-muted mb-2">
              Save this key — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-sm text-brand-cyan break-all">{newKey}</code>
              <button
                onClick={() => copy(newKey)}
                className="shrink-0 px-3 py-1.5 text-xs border border-white/10 rounded-lg hover:border-brand-cyan/30 transition text-brand-muted hover:text-brand-cyan"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setNewKey(null)}
                className="shrink-0 text-brand-muted hover:text-white transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Load error */}
        {error && (
          <div className="mx-6 my-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {error} — is the backend running at <code className="font-mono">{API_URL}</code>?
          </div>
        )}

        {/* Keys list */}
        {!error && (loading ? (
          <div className="px-6 py-8 text-sm text-brand-muted text-center">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="px-6 py-8 text-sm text-brand-muted text-center">No API keys yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-muted text-xs font-mono border-b border-white/5">
                <th className="text-left px-6 py-3">NAME</th>
                <th className="text-left px-6 py-3">KEY</th>
                <th className="text-right px-6 py-3">CREATED</th>
                <th className="text-right px-6 py-3">LAST USED</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition">
                  <td className="px-6 py-3.5 font-medium text-brand-text">{k.name}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-brand-muted">{k.key_prefix}</td>
                  <td className="px-6 py-3.5 text-right text-brand-muted text-xs">{timeAgo(k.created_at)}</td>
                  <td className="px-6 py-3.5 text-right text-brand-muted text-xs">{k.last_used_at ? timeAgo(k.last_used_at) : '—'}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => revokeKey(k.id)}
                      disabled={revoking === k.id}
                      className="text-xs text-red-400/50 hover:text-red-400 transition disabled:opacity-40"
                    >
                      {revoking === k.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </section>
  );
}
