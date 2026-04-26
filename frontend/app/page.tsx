'use client';

import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { user } = useUser();

  return (
    <div className="bg-brand-dark text-brand-text font-sans antialiased">
      <nav className="absolute z-50 w-full px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <img src="/icon.png" alt="Dory" className="h-16 w-16 object-contain" />
            <span className="text-xl font-semibold tracking-tight">Dory</span>
          </a>
          <div className="hidden items-center space-x-8 md:flex">
            <a href="#features" className="text-brand-muted transition hover:text-white">
              Features
            </a>
            <a href="/docs" className="text-brand-muted transition hover:text-white">
              Docs
            </a>
            <a href="#pricing" className="text-brand-muted transition hover:text-white">
              Pricing
            </a>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-brand-muted">Hi, {user.firstName ?? user.primaryEmailAddress?.emailAddress}</span>
                <a href="/dashboard" className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/20 transition font-medium">
                  My Dashboard
                </a>
              </div>
            ) : (
              <a href="/sign-in" className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/20 transition font-medium">
                Login
              </a>
            )}
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pb-10 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-cyan/10 via-brand-dark to-brand-dark" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-brand-panel px-3 py-1">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-brand-muted">Now in Beta for Early Adopters</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Stop burning cash on
            <br />
            <span className="bg-gradient-to-r from-brand-cyan to-cyan-400 bg-clip-text text-transparent">
              invisible AI agents.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-brand-muted md:text-xl">
            The observability layer for autonomous spend. Track every model call, set hard limits,
            and attribute costs down to the specific agent workflow.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="w-full rounded-lg bg-brand-cyan px-8 py-3 font-semibold text-brand-dark shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 sm:w-auto"
            >
              Start Monitoring Free
            </a>
            <a
              href="#"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-8 py-3 font-medium transition hover:bg-white/10 sm:w-auto"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-panel shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-white/10 bg-brand-dark/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-4 font-mono text-xs text-brand-muted">dashboard.dory.io</span>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3 md:p-8">
              <div className="rounded-lg border border-white/5 bg-brand-dark/50 p-4">
                <p className="mb-1 font-mono text-xs text-brand-muted">TOTAL AGENT BURN</p>
                <p className="text-3xl font-bold text-white">$1,240.89</p>
                <div className="mt-2 flex items-center text-xs text-green-400">
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  12% lower than last week
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-brand-dark/50 p-4">
                <p className="mb-1 font-mono text-xs text-brand-muted">ACTIVE AGENTS</p>
                <p className="text-3xl font-bold text-white">47</p>
                <div className="mt-4 h-1.5 w-full rounded-full bg-brand-panel">
                  <div className="h-1.5 rounded-full bg-brand-cyan" style={{ width: "75%" }} />
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-brand-dark/50 p-4">
                <p className="mb-1 font-mono text-xs text-brand-muted">BLOCKED OVERAGES</p>
                <p className="text-3xl font-bold text-white">12</p>
                <p className="mt-2 text-xs text-brand-muted">Last triggered: 2 mins ago</p>
              </div>
            </div>
            <div className="overflow-x-auto border-t border-white/5 bg-brand-dark/30 p-6 font-mono text-sm">
              <pre>{`import anthropic
import dory

client = dory.wrap(
    anthropic.Anthropic(),
    agent="document-pipeline",
    api_url="https://api.dory.io",
    api_key="dory_sk_live_...",
)

# Every call is tracked automatically
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
)`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-4">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-lg font-semibold text-white mb-1">Monitor your usage intuitively</p>
            <p className="text-sm text-brand-muted">Real-time spend breakdowns per agent, model, and function — all in one place.</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white mb-1">Easy to import</p>
            <p className="text-sm text-brand-muted">One line to wrap your existing Anthropic client. No refactoring required.</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white mb-1">Configurable YAML for full control</p>
            <p className="text-sm text-brand-muted">Set budgets, alerts, and rate limits per agent with a simple config file.</p>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-panel shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-white/10 bg-brand-dark/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-4 font-mono text-xs text-brand-muted">dory.yaml</span>
            </div>
            <div className="overflow-x-auto p-6 font-mono text-sm md:p-8">
              <pre className="text-brand-muted leading-relaxed">{`agents:
  document-pipeline:
    budget_usd: 50.00        `}<span className="text-white/30"># hard cap per month</span>{`
    alert_at: 0.80           `}<span className="text-white/30"># alert at 80% usage</span>{`
    model_preference: sonnet `}<span className="text-white/30"># fallback if opus exceeds budget</span>{`

  support-bot:
    budget_usd: 10.00
    alert_at: 0.90
    rate_limit: 100          `}<span className="text-white/30"># max calls per hour</span>{`

  data-extractor:
    budget_usd: 5.00
    alert_at: 0.75
    block_on_exceed: true    `}<span className="text-white/30"># hard stop, no overages</span></pre>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Infrastructure for the Agent Economy
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-brand-muted">
              You wouldn&apos;t run a team without a CFO. Don&apos;t run agents without Dory.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group rounded-xl border border-white/5 bg-brand-panel/50 p-8 transition hover:border-brand-cyan/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-cyan/10 transition group-hover:bg-brand-cyan/20">
                <svg className="h-6 w-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Real-Time Attribution</h3>
              <p className="text-brand-muted">
                Trace every API call back to the specific agent and workflow. No more mystery line
                items on your Stripe bill.
              </p>
            </div>
            <div className="group rounded-xl border border-white/5 bg-brand-panel/50 p-8 transition hover:border-brand-cyan/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-cyan/10 transition group-hover:bg-brand-cyan/20">
                <svg className="h-6 w-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Programmable Limits</h3>
              <p className="text-brand-muted">
                Set hard budget caps per agent. If an infinite loop starts burning cash, we kill the
                process instantly.
              </p>
            </div>
            <div className="group rounded-xl border border-white/5 bg-brand-panel/50 p-8 transition hover:border-brand-cyan/30">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-cyan/10 transition group-hover:bg-brand-cyan/20">
                <svg className="h-6 w-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">One Integration</h3>
              <p className="text-brand-muted">
                Works with LangChain, AutoGPT, and custom stacks. Drop in our SDK and get visibility
                in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between md:flex-row">
          <div className="mb-4 flex items-center space-x-2 md:mb-0">
            <img src="/icon.png" alt="Dory" className="h-12 w-12 object-contain" />
            <span className="font-semibold">Dory</span>
          </div>
          <div className="flex space-x-6 text-sm text-brand-muted">
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition hover:text-white">
              Terms
            </a>
            <a href="#" className="transition hover:text-white">
              Security
            </a>
            <a href="#" className="transition hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
