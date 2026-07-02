'use client';
import { useEffect, useState } from 'react';
import type { Task, Goal, Project } from '@/lib/types';
import { validateTask, formatMinutes } from '@/lib/validation';

const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';
const EMPTY: Partial<Task> = { title: '', priority: 'P3', energy: 'low', estimated_minutes: 30, status: 'backlog', deadline: '', success_criteria: '' };

export default function BacklogPage() {
  const [tab, setTab] = useState<'backlog' | 'someday'>('backlog');
  const [tasks, setTasks] = useState<(Task & { goal_title?: string; project_name?: string })[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Partial<Task>>({ ...EMPTY, status: 'backlog' });
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/tasks?status=${tab}`).then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([t, g, p]) => { setTasks(Array.isArray(t) ? t : []); setGoals(Array.isArray(g) ? g : []); setProjects(Array.isArray(p) ? p : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [tab]);

  const openNew = () => { setEditTask({ ...EMPTY, status: tab }); setErrors([]); setShowForm(true); };
  const openEdit = (t: Task) => { setEditTask({ ...t }); setErrors([]); setShowForm(true); };

  const save = async () => {
    const v = validateTask(editTask as Parameters<typeof validateTask>[0]);
    if (!v.valid) { setErrors(v.errors); return; }
    const method = editTask.id ? 'PUT' : 'POST';
    const url = editTask.id ? `/api/tasks/${editTask.id}` : '/api/tasks';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTask) });
    setShowForm(false); load();
  };

  const promote = async (t: Task) => {
    await fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, status: 'todo' }) });
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); load();
  };

  const fieldErr = (f: string) => errors.find(e => e.field === f)?.message;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Backlog & Someday</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Ideas and deferred tasks waiting their turn</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'backlog' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('backlog')}>📦 Backlog</button>
        <button className={`btn ${tab === 'someday' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('someday')}>🌙 Someday</button>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.length === 0 ? (
            <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>
              {tab === 'backlog' ? 'Backlog is empty.' : 'Someday list is empty.'} <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={openNew}>Add one →</button>
            </div>
          ) : (
            <table>
              <thead><tr><th>Task</th><th>P</th><th>Est</th><th>Goal / Project</th><th>Deadline</th><th></th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 13 }}>{t.title}</td>
                    <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.estimated_minutes)}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.goal_title || t.project_name || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.deadline || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-success" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => promote(t)} title="Move to todo">→ Todo</button>
                        <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => openEdit(t)}>Edit</button>
                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => del(t.id)}>×</button>
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
            <h2 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 800 }}>Add to {tab === 'backlog' ? 'Backlog' : 'Someday'}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" value={editTask.title ?? ''} onChange={e => setEditTask(p => ({ ...p, title: e.target.value }))} />
                {fieldErr('title') && <div className="error-msg">{fieldErr('title')}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Priority *</label>
                  <select className="input" value={editTask.priority ?? 'P3'} onChange={e => setEditTask(p => ({ ...p, priority: e.target.value as Task['priority'] }))}>
                    <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
                  </select>
                  {fieldErr('priority') && <div className="error-msg">{fieldErr('priority')}</div>}
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editTask.status ?? 'backlog'} onChange={e => setEditTask(p => ({ ...p, status: e.target.value as Task['status'] }))}>
                    <option value="backlog">Backlog</option><option value="someday">Someday</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Est. Minutes *</label>
                  <input type="number" className="input" value={editTask.estimated_minutes ?? 30} onChange={e => setEditTask(p => ({ ...p, estimated_minutes: Number(e.target.value) }))} min="0" />
                  {fieldErr('estimated_minutes') && <div className="error-msg">{fieldErr('estimated_minutes')}</div>}
                </div>
                <div>
                  <label className="label">Deadline *</label>
                  <input type="date" className="input" value={editTask.deadline ?? ''} onChange={e => setEditTask(p => ({ ...p, deadline: e.target.value }))} />
                  {fieldErr('deadline') && <div className="error-msg">{fieldErr('deadline')}</div>}
                </div>
              </div>
              <div>
                <label className="label">Link to Goal</label>
                <select className="input" value={editTask.goal_id ?? ''} onChange={e => setEditTask(p => ({ ...p, goal_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">None</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Link to Project</label>
                <select className="input" value={editTask.project_id ?? ''} onChange={e => setEditTask(p => ({ ...p, project_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">None</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {errors.length > 0 && (
              <div style={{ marginTop: '.75rem', background: '#2a0f0f', border: '1px solid #5a2020', borderRadius: 8, padding: '.75rem' }}>
                {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--red)' }}>• {e.message}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
