'use client';
import { useEffect, useState } from 'react';
import type { Habit } from '@/lib/types';

interface HabitLog { habit_id: number; log_date: string; completed: number }

export default function HabitsPage() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, HabitLog[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', target: 'daily' });
  const [loading, setLoading] = useState(true);

  // Generate last 30 days for calendar view
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const load = async () => {
    setLoading(true);
    const hData = await fetch('/api/habits').then(r => r.json());
    const allHabits: Habit[] = Array.isArray(hData) ? hData : [];
    setHabits(allHabits);
    const logMap: Record<number, HabitLog[]> = {};
    await Promise.all(allHabits.map(async h => {
      const lData = await fetch(`/api/habits/${h.id}/log?month=${currentMonth}`).then(r => r.json());
      logMap[h.id] = Array.isArray(lData) ? lData : [];
    }));
    setLogs(logMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (habitId: number, date: string, currentState: boolean) => {
    await fetch(`/api/habits/${habitId}/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ log_date: date, completed: !currentState }) });
    load();
  };

  const addHabit = async () => {
    if (!newHabit.name.trim()) return;
    await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newHabit) });
    setShowForm(false); setNewHabit({ name: '', target: 'daily' }); load();
  };

  const delHabit = async (id: number) => {
    if (!confirm('Delete habit and all logs?')) return;
    await fetch(`/api/habits/${id}`, { method: 'DELETE' }); load();
  };

  const toggleStatus = async (h: Habit) => {
    await fetch(`/api/habits/${h.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...h, status: h.status === 'active' ? 'inactive' : 'active' }) });
    load();
  };

  const isCompleted = (habitId: number, date: string) => {
    const hLogs = logs[habitId] || [];
    return hLogs.some(l => l.log_date === date && l.completed);
  };

  // Only show last 14 days in the calendar grid to keep it compact
  const calDays = days.slice(-14);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Habits</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Build consistent habits with streak tracking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Habit</button>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          {habits.length === 0 ? (
            <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No habits yet. <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={() => setShowForm(true)}>Add your first habit →</button></div>
          ) : (
            <table style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Habit</th>
                  <th style={{ width: 70 }}>Target</th>
                  <th style={{ width: 60 }}>🔥 Streak</th>
                  <th style={{ width: 70 }}>Best</th>
                  {calDays.map(d => (
                    <th key={d} style={{ width: 28, padding: '4px 2px', textAlign: 'center', fontSize: 9 }}>
                      {new Date(d + 'T00:00').getDate()}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {habits.map(h => (
                  <tr key={h.id} style={{ opacity: h.status === 'inactive' ? 0.5 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</span>
                        {h.status === 'inactive' && <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>paused</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{h.target}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: h.current_streak > 0 ? 'var(--yellow)' : 'var(--muted)' }}>
                      {h.current_streak > 0 ? `🔥 ${h.current_streak}` : '0'}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>{h.longest_streak}d</td>
                    {calDays.map(d => {
                      const done = isCompleted(h.id, d);
                      const isToday = d === today;
                      return (
                        <td key={d} style={{ textAlign: 'center', padding: '4px 2px' }}>
                          <button
                            onClick={() => toggle(h.id, d, done)}
                            style={{
                              width: 22, height: 22, borderRadius: 4,
                              border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                              background: done ? 'var(--green)' : 'transparent',
                              cursor: 'pointer', transition: 'background .15s',
                            }}
                            title={d}
                          />
                        </td>
                      );
                    })}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => toggleStatus(h)}>
                          {h.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => delHabit(h.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 800 }}>New Habit</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="label">Habit Name *</label>
                <input className="input" value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Exercise, Read, Meditate" onKeyDown={e => e.key === 'Enter' && addHabit()} autoFocus />
              </div>
              <div>
                <label className="label">Target Frequency</label>
                <input className="input" value={newHabit.target} onChange={e => setNewHabit(p => ({ ...p, target: e.target.value }))} placeholder="daily, 5x/week, weekdays..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addHabit}>Add Habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
