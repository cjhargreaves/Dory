'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

interface AgentSummary {
  agent: string;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  call_count: number;
  last_seen: string;
}

interface SpendSummary {
  total_cost_usd: number;
  agents: AgentSummary[];
}

interface SpendEvent {
  agent: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
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

function modelBadge(model: string) {
  const lower = model.toLowerCase();
  if (lower.includes('opus')) return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  if (lower.includes('sonnet')) return 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30';
  return 'bg-green-500/15 text-green-300 border-green-500/30';
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-brand-dark/50 p-5 rounded-xl border border-white/5">
      <p className="text-brand-muted text-xs font-mono tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-2">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SpendSummary | null>(null);
  const [events, setEvents] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;

      const [sumRes, evtRes] = await Promise.all([
        fetch(`${API_URL}/api/spend/summary`, { headers }),
        fetch(`${API_URL}/api/spend/events`, { headers }),
      ]);

      if (!sumRes.ok) throw new Error(`Summary: ${sumRes.status} ${sumRes.statusText}`);
      if (!evtRes.ok) throw new Error(`Events: ${evtRes.status} ${evtRes.statusText}`);

      const sumData: SpendSummary = await sumRes.json();
      const evtData: { events: SpendEvent[] } = await evtRes.json();

      setSummary(sumData);
      setEvents(evtData.events);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalCalls = summary?.agents.reduce((s, a) => s + a.call_count, 0) ?? 0;
  const totalTokens = summary?.agents.reduce(
    (s, a) => s + a.total_input_tokens + a.total_output_tokens, 0
  ) ?? 0;

  // Derive unique models from recent events
  const modelCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.model] = (acc[e.model] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
              <span className="text-brand-dark font-bold text-lg">D</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">Dory</span>
            <span className="ml-3 px-2 py-0.5 rounded text-xs bg-brand-panel border border-white/10 text-brand-muted font-mono">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-brand-muted hover:text-white transition">Home</a>
            <a href="/docs" className="text-sm text-brand-muted hover:text-white transition">Docs</a>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-panel border border-white/10 rounded-lg hover:border-brand-cyan/30 transition disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Error banner */}
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            <span className="font-semibold">Error:</span> {error}
            <span className="text-red-400/70 ml-2 text-xs">
              — Is the backend running at <code>{API_URL}</code>?
            </span>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="TOTAL SPEND (30D)"
            value={summary ? fmtUsd(summary.total_cost_usd) : '—'}
            sub={loading ? 'Loading…' : undefined}
          />
          <StatCard
            label="ACTIVE AGENTS"
            value={summary ? String(summary.agents.length) : '—'}
            sub={summary ? `${totalCalls.toLocaleString()} total calls` : undefined}
          />
          <StatCard
            label="TOTAL TOKENS"
            value={summary ? totalTokens.toLocaleString() : '—'}
            sub="input + output"
          />
          <StatCard
            label="MODELS IN USE"
            value={String(Object.keys(modelCounts).length || '—')}
            sub={Object.keys(modelCounts).slice(0, 2).join(', ') || undefined}
          />
        </div>

        {/* Agent breakdown table */}
        <section className="mb-10">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">AGENT BREAKDOWN</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 overflow-hidden">
            {loading && !summary ? (
              <div className="p-10 text-center text-brand-muted text-sm">Loading…</div>
            ) : !summary || summary.agents.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">No agent data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-brand-muted text-xs font-mono">
                    <th className="text-left px-5 py-3">AGENT</th>
                    <th className="text-right px-5 py-3">COST</th>
                    <th className="text-right px-5 py-3">CALLS</th>
                    <th className="text-right px-5 py-3">INPUT TOKENS</th>
                    <th className="text-right px-5 py-3">OUTPUT TOKENS</th>
                    <th className="text-right px-5 py-3">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.agents.map((a, i) => (
                    <tr
                      key={a.agent}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition ${i % 2 === 0 ? '' : 'bg-brand-dark/20'}`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">{a.agent}</td>
                      <td className="px-5 py-3.5 text-right text-brand-cyan font-mono">{fmtUsd(a.total_cost_usd)}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{a.call_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{a.total_input_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{a.total_output_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted text-xs">{timeAgo(a.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent events */}
        <section>
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">RECENT EVENTS</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 overflow-hidden">
            {loading && events.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">Loading…</div>
            ) : events.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">No events yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-brand-muted text-xs font-mono">
                    <th className="text-left px-5 py-3">AGENT</th>
                    <th className="text-left px-5 py-3">MODEL</th>
                    <th className="text-right px-5 py-3">COST</th>
                    <th className="text-right px-5 py-3">INPUT</th>
                    <th className="text-right px-5 py-3">OUTPUT</th>
                    <th className="text-right px-5 py-3">WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr
                      key={i}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition ${i % 2 === 0 ? '' : 'bg-brand-dark/20'}`}
                    >
                      <td className="px-5 py-3 font-mono text-brand-text">{e.agent}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs border font-mono ${modelBadge(e.model)}`}>
                          {e.model}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-brand-cyan">{fmtUsd(e.cost_usd)}</td>
                      <td className="px-5 py-3 text-right text-brand-muted">{fmt(e.input_tokens)}</td>
                      <td className="px-5 py-3 text-right text-brand-muted">{fmt(e.output_tokens)}</td>
                      <td className="px-5 py-3 text-right text-brand-muted text-xs">{timeAgo(e.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
