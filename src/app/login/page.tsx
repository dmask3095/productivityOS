'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Login failed'); return; }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: '.05em' }}>PRODUCTIVITY OS</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Sign in to your workspace</div>
        </div>
        <div className="card">
          <form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            {error && <div className="warn" style={{ background: '#2a0f0f', borderColor: '#5a2020', color: 'var(--red)' }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '.65rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 13, color: 'var(--muted)' }}>
            No account? <Link href="/register" style={{ color: 'var(--accent)' }}>Create one →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
