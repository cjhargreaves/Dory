type SpendAgent = {
  agent: string;
  call_count: number;
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  last_seen: string;
};

type SpendSummary = {
  total_cost_usd: number;
  agents: SpendAgent[];
};

type SpendEvent = {
  agent: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
};

async function getDashboardData(): Promise<{
  summary: SpendSummary | null;
  events: SpendEvent[];
  error: string | null;
}> {
  const apiUrl = (process.env.DORY_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const apiKey = process.env.DORY_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      summary: null,
      events: [],
      error: "Set DORY_API_KEY in frontend/.env.local to load live dashboard data.",
    };
  }

  try {
    const headers = { "X-API-Key": apiKey };
    const [summaryResponse, eventsResponse] = await Promise.all([
      fetch(`${apiUrl}/api/spend/summary`, { headers, cache: "no-store" }),
      fetch(`${apiUrl}/api/spend/events`, { headers, cache: "no-store" }),
    ]);

    if (!summaryResponse.ok) {
      throw new Error(`Summary request failed with ${summaryResponse.status}`);
    }

    if (!eventsResponse.ok) {
      throw new Error(`Events request failed with ${eventsResponse.status}`);
    }

    const summary = (await summaryResponse.json()) as SpendSummary;
    const eventsPayload = (await eventsResponse.json()) as { events: SpendEvent[] };

    return {
      summary,
      events: eventsPayload.events,
      error: null,
    };
  } catch (error) {
    return {
      summary: null,
      events: [],
      error: error instanceof Error ? error.message : "Unable to load dashboard data.",
    };
  }
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export default async function Home() {
  const { summary, events, error } = await getDashboardData();
  const latestEvent = events[0];

  return (
    <div className="bg-brand-dark text-brand-text font-sans antialiased">

      {/* Nav */}
      <nav className="absolute w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
              <span className="text-brand-dark font-bold text-lg">D</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">Dory</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-brand-muted hover:text-white transition">Features</a>
            <a href="/docs" className="text-brand-muted hover:text-white transition">Docs</a>
            <a href="#pricing" className="text-brand-muted hover:text-white transition">Pricing</a>
            <a href="#" className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/20 transition font-medium">
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-cyan/10 via-brand-dark to-brand-dark" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-panel border border-white/10 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            <span className="text-sm text-brand-muted">Now in Beta for Early Adopters</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Stop burning cash on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-cyan-400">
              invisible AI agents.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10">
            The observability layer for autonomous spend. Track every model call, set hard limits, and attribute costs down to the specific agent workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" className="w-full sm:w-auto px-8 py-3 bg-brand-cyan text-brand-dark font-semibold rounded-lg hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20">
              Start Monitoring Free
            </a>
            <a href="/docs" className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition font-medium">
              See the Docs
            </a>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-brand-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-brand-dark/50 border-b border-white/10 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-brand-muted font-mono">dashboard.dory.io</span>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-brand-dark/50 p-4 rounded-lg border border-white/5">
                <p className="text-brand-muted text-xs font-mono mb-1">TOTAL AGENT BURN</p>
                <p className="text-3xl font-bold text-white">
                  {currencyFormatter.format(summary?.total_cost_usd ?? 0)}
                </p>
                <p className="mt-2 text-xs text-brand-muted">
                  Last 30 days across all tracked agent calls
                </p>
              </div>
              <div className="bg-brand-dark/50 p-4 rounded-lg border border-white/5">
                <p className="text-brand-muted text-xs font-mono mb-1">ACTIVE AGENTS</p>
                <p className="text-3xl font-bold text-white">{summary?.agents.length ?? 0}</p>
                <div className="w-full bg-brand-panel rounded-full h-1.5 mt-4">
                  <div
                    className="bg-brand-cyan h-1.5 rounded-full"
                    style={{ width: `${Math.min((summary?.agents.length ?? 0) * 12, 100)}%` }}
                  />
                </div>
              </div>
              <div className="bg-brand-dark/50 p-4 rounded-lg border border-white/5">
                <p className="text-brand-muted text-xs font-mono mb-1">LATEST EVENT</p>
                <p className="text-xl font-bold text-white">{latestEvent?.agent ?? "No events yet"}</p>
                <p className="text-xs text-brand-muted mt-2">
                  {latestEvent
                    ? `${latestEvent.model} • ${currencyFormatter.format(latestEvent.cost_usd)}`
                    : "Send one tracked SDK event to create the dory database."}
                </p>
              </div>
            </div>
            <div className="bg-brand-dark/30 p-6 border-t border-white/5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm font-mono text-brand-muted">Recent tracked events</p>
                {error ? <p className="text-xs text-amber-300">{error}</p> : null}
              </div>
              <div className="space-y-3">
                {events.length > 0 ? (
                  events.slice(0, 5).map((event) => (
                    <div
                      key={`${event.agent}-${event.timestamp}-${event.model}`}
                      className="grid grid-cols-[1.2fr_1.4fr_0.8fr] gap-4 rounded-lg border border-white/5 bg-brand-dark/40 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-white">{event.agent}</p>
                        <p className="text-xs text-brand-muted">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white">{event.model}</p>
                        <p className="text-xs text-brand-muted">
                          {event.input_tokens} in • {event.output_tokens} out
                        </p>
                      </div>
                      <div className="text-right font-mono text-brand-cyan">
                        {currencyFormatter.format(event.cost_usd)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-brand-muted">
                    No spend events have been stored yet. Once the SDK successfully posts to the backend,
                    this panel will populate from MongoDB.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Infrastructure for the Agent Economy</h2>
            <p className="text-brand-muted text-lg max-w-2xl mx-auto">
              You wouldn&apos;t run a team without a CFO. Don&apos;t run agents without Dory.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-panel/50 p-8 rounded-xl border border-white/5 hover:border-brand-cyan/30 transition group">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-cyan/20 transition">
                <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Attribution</h3>
              <p className="text-brand-muted">Trace every API call back to the specific agent and workflow. No more mystery line items on your Stripe bill.</p>
            </div>
            <div className="bg-brand-panel/50 p-8 rounded-xl border border-white/5 hover:border-brand-cyan/30 transition group">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-cyan/20 transition">
                <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Programmable Limits</h3>
              <p className="text-brand-muted">Set hard budget caps per agent. If an infinite loop starts burning cash, we kill the process instantly.</p>
            </div>
            <div className="bg-brand-panel/50 p-8 rounded-xl border border-white/5 hover:border-brand-cyan/30 transition group">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-cyan/20 transition">
                <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">One Integration</h3>
              <p className="text-brand-muted">Works with LangChain, AutoGPT, and custom stacks. Drop in our SDK and get visibility in minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-brand-cyan rounded flex items-center justify-center">
              <span className="text-brand-dark font-bold text-xs">D</span>
            </div>
            <span className="font-semibold">Dory</span>
          </div>
          <div className="flex space-x-6 text-sm text-brand-muted">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Security</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
