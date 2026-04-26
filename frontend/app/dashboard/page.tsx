'use client';

import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function modelBadge(model: string) {
  const lower = model.toLowerCase();

  if (lower.includes('opus')) return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  if (lower.includes('sonnet')) return 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30';

  return 'bg-green-500/15 text-green-300 border-green-500/30';
}

function getApiHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  return headers;
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { detail?: string };
    if (data.detail) {
      return data.detail;
    }
  } catch {
    return `${response.status} ${response.statusText}`;
  }

  return `${response.status} ${response.statusText}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-brand-dark/50 p-5">
      <p className="mb-1 text-xs font-mono tracking-widest text-brand-muted">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-2 text-xs text-brand-muted">{sub}</p> : null}
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
      const headers = getApiHeaders();
      const [sumRes, evtRes, detRes] = await Promise.all([
        fetch(`${API_URL}/api/spend/summary`, { headers }),
        fetch(`${API_URL}/api/spend/events`, { headers }),
        fetch(`${API_URL}/api/spend/detailed`, { headers }),
      ]);

      if (!sumRes.ok) throw new Error(`Summary: ${await readErrorMessage(sumRes)}`);
      if (!evtRes.ok) throw new Error(`Events: ${await readErrorMessage(evtRes)}`);
      if (!detRes.ok) throw new Error(`Details: ${await readErrorMessage(detRes)}`);

      const sumData: SpendSummary = await sumRes.json();
      const evtData: { events: SpendEvent[] } = await evtRes.json();
      const detData: { details: DetailedBreakdown[] } = await detRes.json();

      setSummary(sumData);
      setEvents(evtData.events);
      setDetails(detData.details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
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
      const response = await fetch(`${API_URL}/api/ai/dashboard-suggestions`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          summary,
          details,
          events,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data: AiSuggestionResponse = await response.json();
      setAiSuggestions(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totalCalls = summary?.agents.reduce((sum, agent) => sum + agent.call_count, 0) ?? 0;
  const totalTokens = summary?.agents.reduce((sum, agent) => {
    return sum + agent.total_input_tokens + agent.total_output_tokens;
  }, 0) ?? 0;

  const colors = ['#00D4FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const pieData = summary?.models.map((model, index) => ({
    name: model.model,
    value: model.total_cost_usd,
    calls: model.call_count,
    percentage: summary.total_cost_usd > 0
      ? (model.total_cost_usd / summary.total_cost_usd) * 100
      : 0,
    color: colors[index % colors.length],
  })) ?? [];

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-brand-text antialiased">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan">
                <span className="text-lg font-bold text-brand-dark">D</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Dory</span>
            </a>
            <span className="ml-3 rounded border border-white/10 bg-brand-panel px-2 py-0.5 font-mono text-xs text-brand-muted">
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
            <a href="/" className="text-sm text-brand-muted transition hover:text-white">Home</a>
            <a href="/docs" className="text-sm text-brand-muted transition hover:text-white">Docs</a>
            {user?.primaryEmailAddress?.emailAddress ? (
              <span className="text-sm text-brand-muted">
                {user.primaryEmailAddress.emailAddress}
              </span>
            ) : null}
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="text-sm text-brand-muted transition hover:text-white"
            >
              Logout
            </button>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-brand-panel px-3 py-1.5 text-sm transition hover:border-brand-cyan/30 disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {error ? (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <span className="font-semibold">Error:</span> {error}
            <span className="ml-2 text-xs text-red-400/70">
              Is the backend running at <code>{API_URL}</code>?
            </span>
          </div>
        ) : null}

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

        {summary && summary.agents.length > 0 && <>

        {/* Model Usage Pie Chart */}
        <section className="mb-10">
          <div className="rounded-xl border border-white/5 bg-brand-panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="mb-2 text-sm font-mono tracking-widest text-brand-muted">
                  AI OPTIMIZATION SUGGESTIONS
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-brand-muted">
                  Uses the current dashboard snapshot and sends agent, model, and call breakdown
                  data to Gemini 1.5 Flash for model optimization recommendations.
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

            {aiError ? (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                <span className="font-semibold">Suggestion error:</span> {aiError}
              </div>
            ) : null}

            <div className="mt-5 rounded-xl border border-white/5 bg-brand-dark/40 p-5">
              {aiLoading ? (
                <div className="text-sm text-brand-muted">Gemini 1.5 Flash is reviewing the current dashboard data...</div>
              ) : aiSuggestions ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono">
                      {aiSuggestions.model}
                    </span>
                    <span>Generated {timeAgo(aiSuggestions.generated_at)}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-brand-text">
                    {aiSuggestions.suggestions}
                  </div>
                </>
              ) : (
                <div className="text-sm text-brand-muted">
                  No suggestions yet. Click the button to analyze the agent breakdown currently shown on this page.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            MODEL USAGE BY COST
          </h2>
          <div className="rounded-xl border border-white/5 bg-brand-panel p-6">
            {loading && !summary ? (
              <div className="flex h-80 items-center justify-center text-sm text-brand-muted">
                Loading...
              </div>
            ) : !summary || pieData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-brand-muted">
                No model data yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto]">
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
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{entry.name}</p>
                        <p className="text-xs text-brand-muted">
                          {entry.percentage.toFixed(1)}% | {fmtUsd(entry.value)} | {entry.calls.toLocaleString()} calls
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            AGENT BREAKDOWN
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-brand-panel">
            {loading && !summary ? (
              <div className="p-10 text-center text-sm text-brand-muted">Loading...</div>
            ) : !summary || summary.agents.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">No agent data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-brand-muted">
                    <th className="px-5 py-3 text-left">AGENT</th>
                    <th className="px-5 py-3 text-right">COST</th>
                    <th className="px-5 py-3 text-right">CALLS</th>
                    <th className="px-5 py-3 text-right">INPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">OUTPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.agents.map((agent, index) => (
                    <tr
                      key={agent.agent}
                      className={`border-b border-white/5 transition hover:bg-white/2 last:border-0 ${
                        index % 2 === 0 ? '' : 'bg-brand-dark/20'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">
                        {agent.agent}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-brand-cyan">
                        {fmtUsd(agent.total_cost_usd)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {agent.call_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {agent.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {agent.total_output_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-brand-muted">
                        {timeAgo(agent.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            MODEL BREAKDOWN
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-brand-panel">
            {loading && !summary ? (
              <div className="p-10 text-center text-sm text-brand-muted">Loading...</div>
            ) : !summary || summary.models.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">No model data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-brand-muted">
                    <th className="px-5 py-3 text-left">MODEL</th>
                    <th className="px-5 py-3 text-right">COST</th>
                    <th className="px-5 py-3 text-right">CALLS</th>
                    <th className="px-5 py-3 text-right">AGENTS</th>
                    <th className="px-5 py-3 text-right">INPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">OUTPUT TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.models.map((model, index) => (
                    <tr
                      key={model.model}
                      className={`border-b border-white/5 transition hover:bg-white/2 last:border-0 ${
                        index % 2 === 0 ? '' : 'bg-brand-dark/20'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className={`rounded border px-2 py-0.5 font-mono text-xs ${modelBadge(model.model)}`}>
                          {model.model}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-brand-cyan">
                        {fmtUsd(model.total_cost_usd)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {model.call_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {model.agent_count}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {model.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {model.total_output_tokens.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            FUNCTION BREAKDOWN
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-brand-panel">
            {loading && !summary ? (
              <div className="p-10 text-center text-sm text-brand-muted">Loading...</div>
            ) : !summary || summary.functions.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">
                No function-level data yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-brand-muted">
                    <th className="px-5 py-3 text-left">FUNCTION</th>
                    <th className="px-5 py-3 text-right">COST</th>
                    <th className="px-5 py-3 text-right">CALLS</th>
                    <th className="px-5 py-3 text-right">MODELS</th>
                    <th className="px-5 py-3 text-right">INPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">OUTPUT TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.functions.map((fn, index) => (
                    <tr
                      key={fn.function_name}
                      className={`border-b border-white/5 transition hover:bg-white/2 last:border-0 ${
                        index % 2 === 0 ? '' : 'bg-brand-dark/20'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">
                        {fn.function_name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-brand-cyan">
                        {fmtUsd(fn.total_cost_usd)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {fn.call_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {fn.model_count}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {fn.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {fn.total_output_tokens.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            DETAILED BREAKDOWN (AGENT + MODEL)
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-brand-panel">
            {loading && details.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">Loading...</div>
            ) : details.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">No detailed data yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-brand-muted">
                    <th className="px-5 py-3 text-left">AGENT</th>
                    <th className="px-5 py-3 text-left">MODEL</th>
                    <th className="px-5 py-3 text-left">FUNCTION</th>
                    <th className="px-5 py-3 text-right">COST</th>
                    <th className="px-5 py-3 text-right">CALLS</th>
                    <th className="px-5 py-3 text-right">INPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">OUTPUT TOKENS</th>
                    <th className="px-5 py-3 text-right">LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr
                      key={`${detail.agent}-${detail.model}-${detail.function_name ?? 'unspecified'}`}
                      className={`border-b border-white/5 transition hover:bg-white/2 last:border-0 ${
                        index % 2 === 0 ? '' : 'bg-brand-dark/20'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-brand-text">
                        {detail.agent}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded border px-2 py-0.5 font-mono text-xs ${modelBadge(detail.model)}`}>
                          {detail.model}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-brand-muted">
                        {detail.function_name || 'unspecified'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-brand-cyan">
                        {fmtUsd(detail.total_cost_usd)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {detail.call_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {detail.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brand-muted">
                        {detail.total_output_tokens.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-brand-muted">
                        {timeAgo(detail.last_seen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-mono tracking-widest text-brand-muted">
            RECENT EVENTS
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-brand-panel">
            {loading && events.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">Loading...</div>
            ) : events.length === 0 ? (
              <div className="p-10 text-center text-sm text-brand-muted">No events yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-brand-muted">
                    <th className="px-5 py-3 text-left">AGENT</th>
                    <th className="px-5 py-3 text-left">MODEL</th>
                    <th className="px-5 py-3 text-right">COST</th>
                    <th className="px-5 py-3 text-right">INPUT</th>
                    <th className="px-5 py-3 text-right">OUTPUT</th>
                    <th className="px-5 py-3 text-right">WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr
                      key={`${event.agent}-${event.model}-${event.timestamp}-${index}`}
                      className={`border-b border-white/5 transition hover:bg-white/2 last:border-0 ${
                        index % 2 === 0 ? '' : 'bg-brand-dark/20'
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-brand-text">{event.agent}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded border px-2 py-0.5 font-mono text-xs ${modelBadge(event.model)}`}>
                          {event.model}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-brand-cyan">
                        {fmtUsd(event.cost_usd)}
                      </td>
                      <td className="px-5 py-3 text-right text-brand-muted">
                        {fmt(event.input_tokens)}
                      </td>
                      <td className="px-5 py-3 text-right text-brand-muted">
                        {fmt(event.output_tokens)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-brand-muted">
                        {timeAgo(event.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        </>}

      </main>
    </div>
  );
}
