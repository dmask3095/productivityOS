'use client';
import { useEffect, useState } from 'react';
import type { DailyLog, Goal, Project } from '@/lib/types';

const DIFF_LABELS = ['', '😴 Very Easy', '😊 Easy', '😐 Medium', '😤 Hard', '🤯 Very Hard'];

export default function DailyLogPage() {
  const today = new Date().toISOString().split('T')[0];
  const [logs, setLogs] = useState<(DailyLog & { goal_title?: string; project_name?: string })[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Partial<DailyLog>>({ log_date: today, task_description: '', time_spent_minutes: 0, difficulty: 3, lessons: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/daily-log').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([l, g, p]) => { setLogs(Array.isArray(l) ? l : []); setGoals(Array.isArray(g) ? g : []); setProjects(Array.isArray(p) ? p : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEdit({ log_date: today, task_description: '', time_spent_minutes: 0, difficulty: 3, lessons: '' }); setShowForm(true); };
  const openEdit = (l: DailyLog) => { setEdit({ ...l }); setShowForm(true); };

  const save = async () => {
    if (!edit.task_description?.trim()) return alert('Task description required');
    const method = edit.id ? 'PUT' : 'POST';
    const url = edit.id ? `/api/daily-log/${edit.id}` : '/api/daily-log';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
    setShowForm(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete log entry?')) return;
    await fetch(`/api/daily-log/${id}`, { method: 'DELETE' }); load();
  };

  const formatMins = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim() : `${m}m`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Daily Log</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Track what you did, how long, and what you learned</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Entry</button>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No log entries yet. <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={openNew}>Add first entry →</button></div>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Task</th><th>Goal / Project</th><th>Time</th><th>Difficulty</th><th>Lessons</th><th></th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{l.log_date}</td>
                    <td style={{ fontSize: 13, maxWidth: 200 }}>{l.task_description}</td>
                    <td style={{ fontSize: 11, color: 'var(--accent)' }}>{l.goal_title || l.project_name || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{l.time_spent_minutes ? formatMins(l.time_spent_minutes) : '—'}</td>
                    <td style={{ fontSize: 11 }}>{DIFF_LABELS[l.difficulty] || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lessons || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => openEdit(l as DailyLog)}>Edit</button>
                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => del(l.id)}>×</button>
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
          <div className="modal">
            <h2 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 800 }}>{edit.id ? 'Edit Log Entry' : 'New Log Entry'}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={edit.log_date ?? today} onChange={e => setEdit(p => ({ ...p, log_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Task / What you did *</label>
                <textarea className="input" value={edit.task_description ?? ''} onChange={e => setEdit(p => ({ ...p, task_description: e.target.value }))} placeholder="What did you work on?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Link to Goal</label>
                  <select className="input" value={edit.goal_id ?? ''} onChange={e => setEdit(p => ({ ...p, goal_id: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">None</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Link to Project</label>
                  <select className="input" value={edit.project_id ?? ''} onChange={e => setEdit(p => ({ ...p, project_id: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Time Spent (minutes)</label>
                  <input type="number" className="input" value={edit.time_spent_minutes ?? 0} onChange={e => setEdit(p => ({ ...p, time_spent_minutes: Number(e.target.value) }))} min="0" />
                </div>
                <div>
                  <label className="label">Difficulty (1–5)</label>
                  <select className="input" value={edit.difficulty ?? 3} onChange={e => setEdit(p => ({ ...p, difficulty: Number(e.target.value) }))}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{DIFF_LABELS[n]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Lessons Learned</label>
                <textarea className="input" value={edit.lessons ?? ''} onChange={e => setEdit(p => ({ ...p, lessons: e.target.value }))} placeholder="What did you learn? What would you do differently?" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{edit.id ? 'Save' : 'Add Entry'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
