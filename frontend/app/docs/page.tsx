"use client";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { icon?: string; width?: string }, HTMLElement>;
    }
  }
}

type PageId = "quickstart" | "installation" | "anthropic" | "openai" | "gemini" | "mcp-overview" | "mcp-setup";

const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "quickstart" as PageId, label: "Quick Start", icon: "lucide:zap" },
      { id: "installation" as PageId, label: "Installation", icon: "lucide:download" },
    ],
  },
  {
    group: "Model Providers",
    items: [
      { id: "anthropic" as PageId, label: "Anthropic", icon: "lucide:message-square" },
      { id: "openai" as PageId, label: "OpenAI", icon: "lucide:sparkles" },
      { id: "gemini" as PageId, label: "Gemini", icon: "lucide:atom" },
    ],
  },
  {
    group: "MCP Integration",
    items: [
      { id: "mcp-overview" as PageId, label: "Overview", icon: "lucide:network" },
      { id: "mcp-setup" as PageId, label: "Windsurf Setup", icon: "lucide:settings" },
    ],
  },
];

const LANG_MAP: Record<string, string> = {
  "agent.py": "python",
  "requirements.txt": "text",
  "Terminal": "bash",
  "~/.codeium/windsurf/mcp_config.json": "json",
  ".env": "bash",
};

function CodeBlock({ filename, code }: { filename: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const lang = LANG_MAP[filename] ?? "bash";
  return (
    <div className="relative rounded-lg border border-white/5 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-brand-panel border-b border-white/5">
        <span className="text-xs text-brand-muted font-mono">{filename}</span>
        <button
          className="text-xs text-brand-muted hover:text-brand-cyan transition"
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8rem", background: "#111827" }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded">{label}</span>;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan/10 text-brand-cyan text-sm font-semibold">{n}</span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PageNav({ prev, next, onNavigate }: { prev?: { id: PageId; label: string }; next?: { id: PageId; label: string }; onNavigate: (id: PageId) => void }) {
  return (
    <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
      {prev ? (
        <button onClick={() => onNavigate(prev.id)} className="text-sm text-brand-cyan hover:underline font-medium">
          ← {prev.label}
        </button>
      ) : <span />}
      {next ? (
        <button onClick={() => onNavigate(next.id)} className="text-sm text-brand-cyan hover:underline font-medium">
          {next.label} →
        </button>
      ) : <span />}
    </div>
  );
}

export default function Docs() {
  const [page, setPage] = useState<PageId>("quickstart");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (id: PageId) => { setPage(id); setMobileOpen(false); window.scrollTo(0, 0); };

  return (
    <div className="bg-brand-dark text-brand-text font-sans antialiased min-h-screen">

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-brand-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="h-full flex items-center justify-between px-4 md:px-6 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-white/5 transition" onClick={() => setMobileOpen(true)}>
              <iconify-icon icon="lucide:menu" width="20" class="text-brand-muted" />
            </button>
            <a href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Keel" className="h-10 w-10 object-contain" />
              <span className="font-semibold text-lg tracking-tight">Keel</span>
              <span className="hidden sm:inline text-xs font-medium text-brand-muted bg-brand-panel border border-white/10 rounded px-2 py-0.5 ml-1">Docs</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-brand-panel/60 border border-white/5 rounded-lg px-3 py-1.5">
              <iconify-icon icon="lucide:search" width="14" class="text-brand-muted mr-2" />
              <span className="text-xs text-brand-muted">Search docs...</span>
              <kbd className="ml-6 text-[10px] text-brand-muted bg-brand-dark px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
            </div>
            <a href="https://github.com/cjhargreaves/Keel" className="hidden sm:flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cyan transition px-2.5 py-1.5 rounded-md hover:bg-brand-cyan/5">
              <iconify-icon icon="lucide:github" width="14" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex pt-14">

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-14 left-0 z-40 w-72 h-[calc(100vh-3.5rem)] bg-brand-dark border-r border-white/5 overflow-y-auto transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <nav className="p-4 space-y-1">
            {NAV.map((section) => (
              <div key={section.group} className="mb-4">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-brand-muted/60 mb-2">{section.group}</p>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md border-l-2 transition text-left ${
                      page === item.id
                        ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan"
                        : "border-transparent text-brand-muted hover:bg-white/3 hover:text-brand-text"
                    }`}
                  >
                    <iconify-icon icon={item.icon} width="15" />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-16">

            {/* Quick Start */}
            {page === "quickstart" && (
              <div>
                <div className="mb-6"><Badge label="GETTING STARTED" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Quick Start</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Get Keel running in under 5 minutes. Install the SDK, wrap your Anthropic client, and start tracking costs automatically.</p>
                <div className="space-y-10">
                  <Step n={1} title="Install the SDK">
                    <CodeBlock filename="Terminal" code="pip install keel-sdk" />
                  </Step>
                  <Step n={2} title="Wrap your Anthropic client">
                    <CodeBlock filename="agent.py" code={`import anthropic
import keel

client = keel.wrap(
    anthropic.Anthropic(api_key="sk-ant-..."),
    agent="my-agent",
    api_url="http://localhost:8000",
    api_key="your-keel-key",
)

# Use exactly like the normal Anthropic client, nothing else changes
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello"}],
)

print(response.content[0].text)`} />
                    <p className="text-sm text-brand-muted">Every call automatically captures token usage and cost in a background thread. Your agent is never blocked.</p>
                  </Step>
                  <Step n={3} title="Verify spend was tracked">
                    <CodeBlock filename="Terminal" code={`curl http://localhost:8000/api/spend/summary \\
  -H "X-API-Key: your-keel-key"`} />
                    <div className="bg-brand-panel rounded-lg border border-white/5 p-5 mt-3">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1">Agent</p>
                          <p className="text-sm font-semibold">my-agent</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1">Cost</p>
                          <p className="text-sm font-semibold text-brand-cyan">$0.000026</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-1">Calls</p>
                          <p className="text-sm font-semibold text-green-400">1</p>
                        </div>
                      </div>
                    </div>
                  </Step>
                </div>
                <PageNav next={{ id: "installation", label: "Installation" }} onNavigate={navigate} />
              </div>
            )}

            {/* Installation */}
            {page === "installation" && (
              <div>
                <div className="mb-6"><Badge label="GETTING STARTED" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Installation</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Keel ships a Python SDK. Python 3.9 or higher is required.</p>

                <h2 className="text-xl font-semibold mb-4">Install</h2>
                <CodeBlock filename="Terminal" code="pip install keel-sdk" />

                <h2 className="text-xl font-semibold mt-8 mb-4">Using a virtual environment (recommended)</h2>
                <CodeBlock filename="Terminal" code={`python3 -m venv venv
source venv/bin/activate
pip install keel-sdk`} />

                <h2 className="text-xl font-semibold mt-8 mb-4">Add to requirements</h2>
                <CodeBlock filename="requirements.txt" code="keel-sdk>=0.1.0" />

                <h2 className="text-xl font-semibold mt-8 mb-4">Requirements</h2>
                <div className="bg-brand-panel rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-dark/50">
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Runtime</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Minimum Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="px-4 py-3 font-medium">Python</td>
                        <td className="px-4 py-3 text-brand-muted font-mono">&gt;= 3.9</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">anthropic</td>
                        <td className="px-4 py-3 text-brand-muted font-mono">&gt;= 0.30.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <PageNav prev={{ id: "quickstart", label: "Quick Start" }} next={{ id: "anthropic", label: "Anthropic" }} onNavigate={navigate} />
              </div>
            )}

            {/* Anthropic */}
            {page === "anthropic" && (
              <div>
                <div className="mb-6"><Badge label="MODEL PROVIDERS" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Anthropic</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Wrap the Anthropic client with <code className="text-brand-cyan font-mono text-base">keel.wrap()</code> to automatically track every Claude model call.</p>

                <h2 className="text-xl font-semibold mb-4">Basic usage</h2>
                <CodeBlock filename="agent.py" code={`import anthropic
import keel

client = keel.wrap(
    anthropic.Anthropic(api_key="sk-ant-..."),
    agent="my-agent",       # name shown in the dashboard
    api_url="http://localhost:8000",
    api_key="your-keel-key",
)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Summarise this document"}],
)
print(response.content[0].text)`} />

                <h2 className="text-xl font-semibold mt-10 mb-4">How it works</h2>
                <p className="text-brand-muted mb-4">
                  <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">keel.wrap()</code> returns a <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">KeelClient</code> that behaves identically to the standard Anthropic client. After each <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">messages.create()</code> call it reads <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">response.usage</code>, calculates cost, and fires the event to your backend in a background thread.
                </p>

                <h2 className="text-xl font-semibold mt-10 mb-4">Supported models</h2>
                <div className="bg-brand-panel rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-dark/50">
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Model</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Input / MTok</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Output / MTok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["claude-opus-4-7", "$15.00", "$75.00"],
                        ["claude-sonnet-4-6", "$3.00", "$15.00"],
                        ["claude-haiku-4-5", "$0.80", "$4.00"],
                        ["claude-3-5-sonnet-20241022", "$3.00", "$15.00"],
                        ["claude-3-5-haiku-20241022", "$0.80", "$4.00"],
                        ["claude-3-opus-20240229", "$15.00", "$75.00"],
                      ].map(([model, input, output]) => (
                        <tr key={model} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-brand-cyan">{model}</td>
                          <td className="px-4 py-3 text-brand-muted">{input}</td>
                          <td className="px-4 py-3 text-brand-muted">{output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PageNav prev={{ id: "installation", label: "Installation" }} next={{ id: "openai", label: "OpenAI" }} onNavigate={navigate} />
              </div>
            )}

            {/* OpenAI */}
            {page === "openai" && (
              <div>
                <div className="mb-6"><Badge label="MODEL PROVIDERS" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">OpenAI</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Wrap the OpenAI client with <code className="text-brand-cyan font-mono text-base">keel.wrap()</code> to automatically track every GPT model call.</p>

                <h2 className="text-xl font-semibold mb-4">Install</h2>
                <CodeBlock filename="Terminal" code="pip install keel-sdk openai" />

                <h2 className="text-xl font-semibold mt-10 mb-4">Basic usage</h2>
                <CodeBlock filename="agent.py" code={`import openai
import keel

client = keel.wrap(
    openai.OpenAI(api_key="sk-..."),
    agent="my-agent",       # name shown in the dashboard
    api_url="http://localhost:8000",
    api_key="your-keel-key",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Summarise this document"}],
)
print(response.choices[0].message.content)`} />

                <h2 className="text-xl font-semibold mt-10 mb-4">How it works</h2>
                <p className="text-brand-muted mb-4">
                  <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">keel.wrap()</code> detects the OpenAI client automatically and returns a <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">KeelOpenAIClient</code> that is a drop-in replacement. After each <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">chat.completions.create()</code> call it reads <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">response.usage.prompt_tokens</code> and <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">completion_tokens</code>, calculates cost, and fires the event to your backend in a background thread.
                </p>

                <h2 className="text-xl font-semibold mt-10 mb-4">Supported models</h2>
                <div className="bg-brand-panel rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-dark/50">
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Model</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Input / MTok</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Output / MTok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["gpt-4o", "$2.50", "$10.00"],
                        ["gpt-4o-mini", "$0.15", "$0.60"],
                        ["gpt-4-turbo", "$10.00", "$30.00"],
                        ["gpt-4", "$30.00", "$60.00"],
                        ["gpt-3.5-turbo", "$0.50", "$1.50"],
                        ["o1", "$15.00", "$60.00"],
                        ["o1-mini", "$3.00", "$12.00"],
                        ["o3-mini", "$1.10", "$4.40"],
                      ].map(([model, input, output]) => (
                        <tr key={model} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-brand-cyan">{model}</td>
                          <td className="px-4 py-3 text-brand-muted">{input}</td>
                          <td className="px-4 py-3 text-brand-muted">{output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PageNav prev={{ id: "anthropic", label: "Anthropic" }} next={{ id: "gemini", label: "Gemini" }} onNavigate={navigate} />
              </div>
            )}

            {/* Gemini */}
            {page === "gemini" && (
              <div>
                <div className="mb-6"><Badge label="MODEL PROVIDERS" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Gemini</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Wrap the Google GenAI client with <code className="text-brand-cyan font-mono text-base">keel.wrap()</code> to automatically track every Gemini model call.</p>

                <h2 className="text-xl font-semibold mb-4">Install</h2>
                <CodeBlock filename="Terminal" code="pip install keel-sdk google-genai" />

                <h2 className="text-xl font-semibold mt-10 mb-4">Basic usage</h2>
                <CodeBlock filename="agent.py" code={`import google.genai
import keel

client = keel.wrap(
    google.genai.Client(api_key="AIza..."),
    agent="my-agent",       # name shown in the dashboard
    api_url="http://localhost:8000",
    api_key="your-keel-key",
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Summarise this document",
)
print(response.text)`} />

                <h2 className="text-xl font-semibold mt-10 mb-4">How it works</h2>
                <p className="text-brand-muted mb-4">
                  <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">keel.wrap()</code> detects the Google GenAI client automatically and returns a <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">KeelGeminiClient</code> that is a drop-in replacement. After each <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">models.generate_content()</code> call it reads <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">response.usage_metadata</code>, calculates cost, and fires the event to your backend in a background thread.
                </p>

                <h2 className="text-xl font-semibold mt-10 mb-4">Supported models</h2>
                <div className="bg-brand-panel rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-dark/50">
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Model</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Input / MTok</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Output / MTok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["gemini-2.5-pro", "$1.25", "$10.00"],
                        ["gemini-2.5-flash", "$0.15", "$0.60"],
                        ["gemini-2.0-flash", "$0.10", "$0.40"],
                        ["gemini-1.5-pro", "$1.25", "$5.00"],
                        ["gemini-1.5-flash", "$0.075", "$0.30"],
                      ].map(([model, input, output]) => (
                        <tr key={model} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-brand-cyan">{model}</td>
                          <td className="px-4 py-3 text-brand-muted">{input}</td>
                          <td className="px-4 py-3 text-brand-muted">{output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PageNav prev={{ id: "openai", label: "OpenAI" }} next={{ id: "mcp-overview", label: "MCP Overview" }} onNavigate={navigate} />
              </div>
            )}

            {/* MCP Overview */}
            {page === "mcp-overview" && (
              <div>
                <div className="mb-6"><Badge label="MCP INTEGRATION" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">MCP Overview</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">The Keel MCP server gives any MCP-compatible coding agent real-time spend visibility and budget awareness, callable mid-task alongside the agent's own tools.</p>

                <h2 className="text-xl font-semibold mb-4">How it works</h2>
                <p className="text-brand-muted mb-6">When an MCP-compatible agent starts, it reads your MCP config and launches the Keel server as a subprocess. The agent can then call Keel tools alongside its built-in ones. The server speaks MCP over stdio and forwards requests to your Keel backend over HTTP.</p>

                <div className="bg-brand-panel rounded-lg border border-white/5 p-5 font-mono text-xs text-brand-muted mb-8">
                  <span className="text-brand-cyan">Agent</span> calls tool
                  {" → "}
                  <span className="text-brand-cyan">MCP server</span> (stdio)
                  {" → "}
                  <span className="text-brand-cyan">Keel backend</span> (HTTP)
                  {" → "}
                  <span className="text-brand-cyan">MongoDB</span>
                </div>

                <h2 className="text-xl font-semibold mb-4">Available tools</h2>
                <div className="bg-brand-panel rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-dark/50">
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Tool</th>
                        <th className="px-4 py-3 text-brand-muted font-mono text-xs uppercase tracking-wider text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["session_spend", "Show spend for the current session (last N hours) broken down by agent, with most expensive calls and their source locations"],
                        ["budget_remaining", "Check how much budget an agent has left against a configured limit. Returns current spend, budget, and status"],
                        ["top_expensive_calls", "Return the most expensive individual API calls with exact source file and line number"],
                        ["start_task", "Mark the start of a named task. All LLM spend until end_task is grouped under that task and shown on the dashboard"],
                        ["end_task", "Close the active task and return a summary: total cost, call count, and duration"],
                      ].map(([tool, desc]) => (
                        <tr key={tool} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-brand-cyan">{tool}</td>
                          <td className="px-4 py-3 text-brand-muted">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PageNav prev={{ id: "gemini", label: "Gemini" }} next={{ id: "mcp-setup", label: "Windsurf Setup" }} onNavigate={navigate} />
              </div>
            )}

            {/* MCP Setup */}
            {page === "mcp-setup" && (
              <div>
                <div className="mb-6"><Badge label="MCP INTEGRATION" /></div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Windsurf Setup</h1>
                <p className="text-lg text-brand-muted mb-10 max-w-2xl">Add Keel as an MCP server in Windsurf so Cascade can check budgets and log spend during any task.</p>

                <div className="space-y-10">
                  <Step n={1} title="Install MCP server dependencies">
                    <CodeBlock filename="Terminal" code={`source backend/venv/bin/activate
pip install -e mcp-server/`} />
                  </Step>
                  <Step n={2} title="Add to Windsurf MCP config">
                    <p className="text-brand-muted mb-3">Open Windsurf, go to <strong className="text-brand-text">Settings → MCP</strong>, and add a new server. The config file lives at <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">~/.codeium/windsurf/mcp_config.json</code>.</p>
                    <CodeBlock filename="~/.codeium/windsurf/mcp_config.json" code={`{
  "mcpServers": {
    "keel": {
      "command": "/path/to/Keel/backend/venv/bin/python3",
      "args": ["/path/to/Keel/mcp-server/server.py"],
      "env": {
        "DORY_API_URL": "http://localhost:8000",
        "KEEL_API_KEY": "your-keel-key",
        "DORY_BUDGET": "10.00",
        "DORY_BUDGET_MY_AGENT": "5.00"
      }
    }
  }
}`} />
                    <div className="border-l-2 border-brand-cyan bg-brand-cyan/5 rounded-r-lg p-4">
                      <p className="text-sm text-brand-text"><code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">KEEL_API_KEY</code> should match the <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">KEEL_API_KEY</code> set in your <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">backend/.env</code>. Use the full path to your venv Python so the <code className="text-xs font-mono bg-brand-panel px-1.5 py-0.5 rounded text-brand-cyan">mcp</code> package is found.</p>
                    </div>
                  </Step>
                  <Step n={3} title="Restart Windsurf">
                    <p className="text-brand-muted">Quit and reopen Windsurf. The Keel tools will appear in Cascade's tool list. You can verify by asking Cascade:</p>
                    <div className="bg-brand-panel rounded-lg border border-white/5 p-4 mt-3 font-mono text-sm text-brand-muted italic">
                      "Use start_task to begin tracking this feature, then end_task when you are done."
                    </div>
                  </Step>
                  <Step n={4} title="Make sure your backend is running">
                    <CodeBlock filename="Terminal" code={`cd backend
source venv/bin/activate
uvicorn app.main:app --reload`} />
                    <p className="text-sm text-brand-muted">The MCP server is just a relay. It requires the Keel backend to be running to do anything.</p>
                  </Step>
                </div>

                <PageNav prev={{ id: "mcp-overview", label: "MCP Overview" }} onNavigate={navigate} />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
