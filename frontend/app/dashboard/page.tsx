'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

interface ModelSummary {
  model: string;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  call_count: number;
  agent_count: number;
}

interface FunctionSummary {
  function_name: string;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  call_count: number;
  model_count: number;
}

interface SpendSummary {
  total_cost_usd: number;
  agents: AgentSummary[];
  models: ModelSummary[];
  functions: FunctionSummary[];
}

interface SpendEvent {
  agent: string;
  model: string;
  function_name?: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
}

interface DetailedBreakdown {
  agent: string;
  model: string;
  function_name?: string;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  call_count: number;
  last_seen: string;
}

interface AiSuggestionResponse {
  model: string;
  generated_at: string;
  suggestions: string;
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
  const { user } = useUser();
  const { signOut } = useClerk();
  const [summary, setSummary] = useState<SpendSummary | null>(null);
  const [events, setEvents] = useState<SpendEvent[]>([]);
  const [details, setDetails] = useState<DetailedBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function resetAll() {
    if (!confirm('Delete all spend data? This cannot be undone.')) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['X-API-Key'] = API_KEY;
    await fetch(`${API_URL}/api/spend/all`, { method: 'DELETE', headers });
    setSummary(null);
    setEvents([]);
    setDetails([]);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;

      const [sumRes, evtRes, detRes] = await Promise.all([
        fetch(`${API_URL}/api/spend/summary`, { headers }),
        fetch(`${API_URL}/api/spend/events`, { headers }),
        fetch(`${API_URL}/api/spend/detailed`, { headers }),
      ]);

      if (!sumRes.ok) throw new Error(`Summary: ${sumRes.status} ${sumRes.statusText}`);
      if (!evtRes.ok) throw new Error(`Events: ${evtRes.status} ${evtRes.statusText}`);
      if (!detRes.ok) throw new Error(`Details: ${detRes.status} ${detRes.statusText}`);

      const sumData: SpendSummary = await sumRes.json();
      const evtData: { events: SpendEvent[] } = await evtRes.json();
      const detData: { details: DetailedBreakdown[] } = await detRes.json();

      setSummary(sumData);
      setEvents(evtData.events);
      setDetails(detData.details);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function generateAiSuggestions() {
    if (!summary) {
      setAiError('Load dashboard data before requesting suggestions.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const response = await fetch(`${API_URL}/api/ai/dashboard-suggestions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ summary, details, events }),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data: AiSuggestionResponse = await response.json();
      setAiSuggestions(data);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to generate suggestions');
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalCalls = summary?.agents.reduce((s, a) => s + a.call_count, 0) ?? 0;
  const totalTokens = summary?.agents.reduce(
    (s, a) => s + a.total_input_tokens + a.total_output_tokens, 0
  ) ?? 0;

  const modelCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.model] = (acc[e.model] ?? 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#00D4FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const pieData = summary?.models.map((m, index) => ({
    name: m.model,
    value: m.total_cost_usd,
    calls: m.call_count,
    percentage: summary ? (m.total_cost_usd / summary.total_cost_usd * 100) : 0,
    color: COLORS[index % COLORS.length],
  })) || [];

  const functionData = summary?.functions.map((f, index) => ({
    name: f.function_name,
    value: f.total_cost_usd,
    percentage: summary ? (f.total_cost_usd / summary.total_cost_usd * 100) : 0,
    color: COLORS[(index + 2) % COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/icon.png" alt="Dory" className="h-14 w-14 object-contain" />
              <span className="font-semibold text-xl tracking-tight">Dory</span>
            </a>
            <span className="px-2.5 py-1 rounded-md text-xs bg-brand-panel border border-white/10 text-brand-muted font-mono">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-brand-muted hover:text-white transition">Home</a>
            <a href="/docs" className="text-sm text-brand-muted hover:text-white transition">Docs</a>
            {user?.primaryEmailAddress?.emailAddress && (
              <span className="text-sm text-brand-muted">{user.primaryEmailAddress.emailAddress}</span>
            )}
            <button onClick={() => signOut({ redirectUrl: '/' })} className="text-sm text-brand-muted hover:text-white transition">Logout</button>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest">OVERVIEW</h2>
          <button
            onClick={resetAll}
            className="text-xs text-red-400/50 hover:text-red-400 transition font-mono"
          >
            Reset all data
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <StatCard
            label="TOTAL SPEND (30D)"
            value={summary ? fmtUsd(summary.total_cost_usd) : '$0.00'}
            sub={loading ? 'Loading…' : undefined}
          />
          <StatCard
            label="ACTIVE AGENTS"
            value={summary ? String(summary.agents.length) : '0'}
            sub={summary ? `${totalCalls.toLocaleString()} total calls` : undefined}
          />
          <StatCard
            label="TOTAL TOKENS"
            value={summary ? totalTokens.toLocaleString() : '0'}
            sub="input + output"
          />
          <StatCard
            label="MODELS IN USE"
            value={summary ? String(summary.models.length) : '0'}
            sub={summary ? `${summary.models.reduce((s, m) => s + m.call_count, 0).toLocaleString()} total calls` : undefined}
          />
          <StatCard
            label="TOP MODEL"
            value={summary && summary.models.length > 0 ? summary.models[0].model.split('/').pop() || summary.models[0].model : 'none'}
            sub={summary && summary.models.length > 0 ? `${(summary.models[0].total_cost_usd / summary.total_cost_usd * 100).toFixed(1)}% of spend` : undefined}
          />
        </div>

        {/* AI Optimization Suggestions */}
        <section className="mb-10">
          <div className="bg-brand-panel rounded-xl border border-white/5 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-2">AI OPTIMIZATION SUGGESTIONS</h2>
                <p className="text-sm text-brand-muted leading-6 max-w-3xl">
                  Uses the current dashboard snapshot and sends agent, model, and call breakdown data to Gemini 1.5 Flash for model optimization recommendations.
                </p>
              </div>
              <button
                onClick={() => void generateAiSuggestions()}
                disabled={loading || aiLoading || !summary}
                className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-2 text-sm font-medium text-brand-cyan transition hover:bg-brand-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Get AI Suggestions'}
              </button>
            </div>
            {aiError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                <span className="font-semibold">Suggestion error:</span> {aiError}
              </div>
            )}
            <div className="mt-5 rounded-xl border border-white/5 bg-brand-dark/40 p-5">
              {aiLoading ? (
                <div className="text-sm text-brand-muted">Gemini 1.5 Flash is reviewing the current dashboard data...</div>
              ) : aiSuggestions ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono">{aiSuggestions.model}</span>
                    <span>Generated {timeAgo(aiSuggestions.generated_at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-brand-text">{aiSuggestions.suggestions}</div>
                </>
              ) : (
                <div className="text-sm text-brand-muted">No suggestions yet. Click the button to analyze the agent breakdown currently shown on this page.</div>
              )}
            </div>
          </div>
        </section>

        {summary && summary.agents.length > 0 && (<>

        {/* Model Usage Pie Chart */}
        <section className="mb-10">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">MODEL USAGE BY COST</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 p-6">
            {loading && !summary ? (
              <div className="h-80 flex items-center justify-center text-brand-muted text-sm">Loading…</div>
            ) : !summary || pieData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-brand-muted text-sm">No model data yet.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `$${Number(value).toFixed(6)} (${props.payload.percentage.toFixed(1)}%)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <div>
                        <p className="text-sm font-medium text-white">{entry.name}</p>
                        <p className="text-xs text-brand-muted">{entry.percentage.toFixed(1)}% · {fmtUsd(entry.value)} · {entry.calls.toLocaleString()} calls</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

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

        {/* Model breakdown table */}
        <section className="mb-10">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">MODEL BREAKDOWN</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 overflow-hidden">
            {loading && !summary ? (
              <div className="p-10 text-center text-brand-muted text-sm">Loading…</div>
            ) : !summary || summary.models.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">No model data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-brand-muted text-xs font-mono">
                    <th className="text-left px-5 py-3">MODEL</th>
                    <th className="text-right px-5 py-3">COST</th>
                    <th className="text-right px-5 py-3">CALLS</th>
                    <th className="text-right px-5 py-3">AGENTS</th>
                    <th className="text-right px-5 py-3">INPUT TOKENS</th>
                    <th className="text-right px-5 py-3">OUTPUT TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.models.map((m, i) => (
                    <tr
                      key={m.model}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition ${i % 2 === 0 ? '' : 'bg-brand-dark/20'}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs border font-mono ${modelBadge(m.model)}`}>
                          {m.model}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-cyan font-mono">{fmtUsd(m.total_cost_usd)}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{m.call_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{m.agent_count}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{m.total_input_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{m.total_output_tokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Function breakdown table */}
        <section className="mb-10">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">FUNCTION BREAKDOWN</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 overflow-hidden">
            {loading && !summary ? (
              <div className="p-10 text-center text-brand-muted text-sm">Loading…</div>
            ) : !summary || summary.functions.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">No function-level data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-brand-muted text-xs font-mono">
                    <th className="text-left px-5 py-3">FUNCTION</th>
                    <th className="text-right px-5 py-3">COST</th>
                    <th className="text-right px-5 py-3">CALLS</th>
                    <th className="text-right px-5 py-3">MODELS</th>
                    <th className="text-right px-5 py-3">INPUT TOKENS</th>
                    <th className="text-right px-5 py-3">OUTPUT TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.functions.map((f, i) => (
                    <tr
                      key={f.function_name}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition ${i % 2 === 0 ? '' : 'bg-brand-dark/20'}`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">{f.function_name}</td>
                      <td className="px-5 py-3.5 text-right text-brand-cyan font-mono">{fmtUsd(f.total_cost_usd)}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{f.call_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{f.model_count}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{f.total_input_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{f.total_output_tokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Detailed breakdown table */}
        <section className="mb-10">
          <h2 className="text-sm font-mono text-brand-muted tracking-widest mb-4">DETAILED BREAKDOWN (AGENT + MODEL)</h2>
          <div className="bg-brand-panel rounded-xl border border-white/5 overflow-hidden">
            {loading && details.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">Loading…</div>
            ) : details.length === 0 ? (
              <div className="p-10 text-center text-brand-muted text-sm">No detailed data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-brand-muted text-xs font-mono">
                    <th className="text-left px-5 py-3">AGENT</th>
                    <th className="text-left px-5 py-3">MODEL</th>
                    <th className="text-left px-5 py-3">FUNCTION</th>
                    <th className="text-right px-5 py-3">COST</th>
                    <th className="text-right px-5 py-3">CALLS</th>
                    <th className="text-right px-5 py-3">INPUT TOKENS</th>
                    <th className="text-right px-5 py-3">OUTPUT TOKENS</th>
                    <th className="text-right px-5 py-3">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr
                      key={`${d.agent}-${d.model}`}
                      className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition ${i % 2 === 0 ? '' : 'bg-brand-dark/20'}`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">{d.agent}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs border font-mono ${modelBadge(d.model)}`}>
                          {d.model}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{d.function_name || 'unspecified'}</td>
                      <td className="px-5 py-3.5 text-right text-brand-cyan font-mono">{fmtUsd(d.total_cost_usd)}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{d.call_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{d.total_input_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">{d.total_output_tokens.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-brand-muted text-xs">{timeAgo(d.last_seen)}</td>
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

        </>)}

      </main>
    </div>
  );
}
