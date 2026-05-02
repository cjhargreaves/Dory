'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { ApiKeys } from '../../components/ApiKeys';

export default function KeysPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur border-b border-white/5 px-6 py-1">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Keel" className="h-24 w-24 object-contain" />
              <span className="font-semibold text-xl tracking-tight text-brand-cyan">Keel</span>
            </a>
            <span className="px-2.5 py-1 rounded-md text-xs bg-brand-panel border border-white/10 text-brand-muted font-mono">
              API Keys
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-brand-muted hover:text-white transition">Dashboard</a>
            <a href="/docs" className="text-sm text-brand-muted hover:text-white transition">Docs</a>
            {user?.primaryEmailAddress?.emailAddress && (
              <span className="text-sm text-brand-muted">{user.primaryEmailAddress.emailAddress}</span>
            )}
            <button onClick={() => signOut({ redirectUrl: '/' })} className="text-sm text-brand-muted hover:text-white transition">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-text">API Keys</h1>
          <p className="text-brand-muted text-sm mt-1">
            Keys are used to authenticate the Keel SDK with your backend. Store them securely — they won&apos;t be shown again after creation.
          </p>
        </div>
        {user && <ApiKeys userId={user.id} />}
      </main>
    </div>
  );
}
