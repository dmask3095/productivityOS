'use client';
import { useEffect, useState } from 'react';
import type { Task, Goal } from '@/lib/types';
import { formatMinutes } from '@/lib/validation';

const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';

export default function CompletedPage() {
  const [tab, setTab] = useState<'tasks' | 'goals'>('tasks');
  const [tasks, setTasks] = useState<(Task & { goal_title?: string; project_name?: string })[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    if (tab === 'tasks') {
      fetch('/api/tasks?status=done').then(r => r.json()).then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); });
    } else {
      fetch('/api/goals?status=completed').then(r => r.json()).then(d => { setGoals(Array.isArray(d) ? d : []); setLoading(false); });
    }
  };

  useEffect(() => { load(); }, [tab]);

  const archiveTask = async (t: Task) => {
    await fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, status: 'archived' }) });
    load();
  };

  const archiveGoal = async (g: Goal) => {
    await fetch(`/api/goals/${g.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...g, status: 'archived' }) });
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Completed</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Archive of your wins</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('tasks')}>✅ Tasks ({tasks.length})</button>
        <button className={`btn ${tab === 'goals' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('goals')}>🎯 Goals ({goals.length})</button>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        tab === 'tasks' ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {tasks.length === 0 ? (
              <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No completed tasks yet. Keep going!</div>
            ) : (
              <table>
                <thead><tr><th>Task</th><th>P</th><th>Goal / Project</th><th>Est</th><th>Actual</th><th>Completed</th><th></th></tr></thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: 13, textDecoration: 'line-through', color: 'var(--muted)' }}>{t.title}</td>
                      <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.goal_title || t.project_name || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.estimated_minutes)}</td>
                      <td style={{ fontSize: 11, color: t.actual_minutes > t.estimated_minutes ? 'var(--yellow)' : 'var(--green)' }}>{formatMinutes(t.actual_minutes)}</td>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '—'}</td>
                      <td><button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => archiveTask(t)}>Archive</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {goals.length === 0 ? (
              <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>No completed goals yet. You&#39;ve got this!</div>
            ) : (
              goals.map(g => (
                <div key={g.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>🏆</span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{g.title}</span>
                      <span className={priorityClass(g.priority)}>{g.priority}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{g.specific_goal}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {g.estimated_hours}h est · {g.actual_hours}h actual · Deadline was {g.deadline}
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => archiveGoal(g)}>Archive</button>
                </div>
              ))
            )}
          </div>
        )
      )}
    </div>
  );
}
