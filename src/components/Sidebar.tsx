'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navGroups = [
  { label: 'Overview', items: [{ href: '/dashboard', icon: '◉', label: 'Dashboard' }] },
  { label: 'Planning', items: [
    { href: '/goals', icon: '🎯', label: 'Goals' },
    { href: '/projects', icon: '📁', label: 'Projects' },
    { href: '/tasks', icon: '✓', label: 'Tasks' },
    { href: '/planner', icon: '📅', label: 'Daily Planner' },
  ]},
  { label: 'Tracking', items: [
    { href: '/time-tracker', icon: '⏱', label: 'Time Tracker' },
    { href: '/habits', icon: '🔁', label: 'Habits' },
    { href: '/daily-log', icon: '📝', label: 'Daily Log' },
  ]},
  { label: 'Reviews', items: [
    { href: '/reviews/weekly', icon: '📊', label: 'Weekly Review' },
    { href: '/reviews/monthly', icon: '📈', label: 'Monthly Review' },
  ]},
  { label: 'Capture', items: [
    { href: '/brain-dump', icon: '💡', label: 'Brain Dump' },
    { href: '/backlog', icon: '📦', label: 'Backlog' },
  ]},
  { label: 'Archive', items: [{ href: '/completed', icon: '✅', label: 'Completed' }] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1rem 0', flexShrink: 0 }}>
      <div style={{ padding: '0 1rem 1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '.75rem' }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.05em', color: 'var(--accent)' }}>PRODUCTIVITY</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em', marginTop: 2 }}>OPERATING SYSTEM</div>
      </div>
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {navGroups.map(group => (
          <div key={group.label} style={{ marginBottom: '.5rem' }}>
            <div style={{ padding: '6px 1rem', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{group.label}</div>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
              return (
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 1rem', textDecoration: 'none', fontSize: 13, color: active ? 'var(--accent)' : 'var(--text)', background: active ? 'rgba(124,106,245,.12)' : 'transparent', borderRight: active ? '3px solid var(--accent)' : '3px solid transparent', fontWeight: active ? 600 : 400, transition: 'background .15s' }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        )}
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', fontSize: 11, justifyContent: 'center' }}>Sign Out</button>
      </div>
    </aside>
  );
}
