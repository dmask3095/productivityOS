'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isOverdue, daysUntil } from '@/lib/validation';

interface Stats {
  activeGoals: number;
  activeProjects: number;
  todayTasks: { id: number; title: string; priority: string; status: string; deadline: string; goal_title?: string; project_name?: string }[];
  weeklyCompletionPct: number;
  monthlyCompletionPct: number;
  avgDailyDeepWork: number;
  totalProductiveHours: number;
  upcomingDeadlines: { id: number; title: string; deadline: string; type: string; priority: string }[];
  overdueTasks: { id: number; title: string; deadline: string; priority: string }[];
}

const priorityColor = (p: string) => p === 'P1' ? '#ff7070' : p === 'P2' ? '#f59e0b' : '#22c55e';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>{today}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active Goals', value: stats?.activeGoals ?? 0, color: 'var(--accent)' },
          { label: 'Active Projects', value: stats?.activeProjects ?? 0, color: 'var(--accent2)' },
          { label: 'Weekly Done %', value: `${stats?.weeklyCompletionPct ?? 0}%`, color: 'var(--green)' },
          { label: 'Monthly Done %', value: `${stats?.monthlyCompletionPct ?? 0}%`, color: '#22c55e' },
          { label: 'Avg Deep Work/day', value: `${(stats?.avgDailyDeepWork ?? 0).toFixed(1)}h`, color: 'var(--yellow)' },
          { label: 'Productive Hrs (month)', value: `${(stats?.totalProductiveHours ?? 0).toFixed(1)}h`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Today's Tasks */}
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Today&apos;s Tasks
            <Link href="/planner" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>View Planner →</Link>
          </h2>
          {!stats?.todayTasks?.length ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No tasks due today. <Link href="/tasks" style={{ color: 'var(--accent)' }}>Add tasks →</Link></p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.todayTasks.slice(0, 8).map(t => (
                <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor(t.priority), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span className="badge" style={{ fontSize: 10, background: 'var(--surface2)', color: 'var(--muted)' }}>{t.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 700, color: stats?.overdueTasks?.length ? 'var(--red)' : 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
            Overdue Tasks
            <Link href="/tasks" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>All Tasks →</Link>
          </h2>
          {!stats?.overdueTasks?.length ? (
            <p style={{ color: 'var(--green)', fontSize: 13 }}>✓ No overdue tasks!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.overdueTasks.slice(0, 6).map(t => (
                <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12 }}>🔴</span>
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--red)', whiteSpace: 'nowrap' }}>{t.deadline}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {!!stats?.upcomingDeadlines?.length && (
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 700 }}>Upcoming Deadlines (Next 7 Days)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.upcomingDeadlines.map((d, i) => {
              const days = daysUntil(d.deadline);
              return (
                <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{d.type}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: days <= 2 ? 'var(--red)' : 'var(--yellow)' }}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
