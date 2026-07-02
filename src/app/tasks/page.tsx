'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Task, Goal, Project } from '@/lib/types';
import { validateTask, formatMinutes, isOverdue } from '@/lib/validation';

const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';
const energyLabel = (e: string) => e === 'high' ? '🟢' : e === 'medium' ? '🟡' : '🔴';
const STATUSES = ['todo', 'in_progress', 'done', 'backlog', 'someday', 'archived'];
const EMPTY: Partial<Task> = { title: '', priority: 'P2', energy: 'medium', estimated_minutes: 0, actual_minutes: 0, status: 'todo', deadline: '', success_criteria: '', notes: '' };

function TasksPageInner() {
  const params = useSearchParams();
  const [tasks, setTasks] = useState<(Task & { goal_title?: string; project_name?: string })[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterStatus, setFilterStatus] = useState('todo');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Partial<Task>>(EMPTY);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const goalFilter = params.get('goal_id');

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filterStatus !== 'all') qs.set('status', filterStatus);
    if (goalFilter) qs.set('goal_id', goalFilter);
    Promise.all([
      fetch(`/api/tasks?${qs}`).then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([t, g, p]) => { setTasks(Array.isArray(t) ? t : []); setGoals(Array.isArray(g) ? g : []); setProjects(Array.isArray(p) ? p : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterStatus, goalFilter]);

  const openNew = () => { setEditTask({ ...EMPTY }); setErrors([]); setShowForm(true); };
  const openEdit = (t: Task) => { setEditTask({ ...t }); setErrors([]); setShowForm(true); };

  const save = async () => {
    const v = validateTask(editTask as Parameters<typeof validateTask>[0]);
    if (!v.valid) { setErrors(v.errors); return; }
    const method = editTask.id ? 'PUT' : 'POST';
    const url = editTask.id ? `/api/tasks/${editTask.id}` : '/api/tasks';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTask) });
    setShowForm(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); load();
  };

  const quickStatus = async (t: Task, s: Task['status']) => {
    await fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, status: s }) }); load();
  };

  const fieldErr = (f: string) => errors.find(e => e.field === f)?.message;
  const displayed = filterPriority ? tasks.filter(t => t.priority === filterPriority) : tasks;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tasks</h1>
        <button className="btn btn-primary" onClick={openNew}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {['todo', 'in_progress', 'done', 'backlog', 'someday', 'archived', 'all'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)} style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['', 'P1', 'P2', 'P3'].map(p => (
            <button key={p} className={`btn ${filterPriority === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterPriority(p)} style={{ fontSize: 11, padding: '4px 10px' }}>{p || 'All'}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {displayed.length === 0 ? <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No tasks. <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={openNew}>Add one →</button></div> : (
            <table>
              <thead>
                <tr><th>#</th><th>Task</th><th>P</th><th>⚡</th><th>Goal / Project</th><th>Est</th><th>Actual</th><th>Status</th><th>Deadline</th><th></th></tr>
              </thead>
              <tbody>
                {displayed.map(t => {
                  const overdue = isOverdue(t.deadline, t.status);
                  return (
                    <tr key={t.id} style={{ opacity: t.status === 'archived' ? 0.5 : 1 }}>
                      <td style={{ fontSize: 10, color: 'var(--muted)' }}>{t.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {t.status === 'done' ? (
                            <span style={{ fontSize: 14, color: 'var(--green)' }}>✓</span>
                          ) : (
                            <button onClick={() => quickStatus(t, 'done')} style={{ width: 16, height: 16, borderRadius: 3, border: '2px solid var(--border)', background: 'transparent', cursor: 'pointer', flexShrink: 0 }} title="Mark done" />
                          )}
                          <span style={{ fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                        </div>
                      </td>
                      <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                      <td style={{ fontSize: 14 }}>{energyLabel(t.energy)}</td>
                      <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.goal_title || t.project_name || '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.estimated_minutes)}</td>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.actual_minutes)}</td>
                      <td>
                        <select style={{ fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', padding: '2px 4px' }}
                          value={t.status} onChange={e => quickStatus(t, e.target.value as Task['status'])}>
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{t.deadline || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => openEdit(t)}>Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => del(t.id)}>×</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 800 }}>{editTask.id ? 'Edit Task' : 'New Task'}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" value={editTask.title ?? ''} onChange={e => setEditTask(p => ({ ...p, title: e.target.value }))} />
                {fieldErr('title') && <div className="error-msg">{fieldErr('title')}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Priority *</label>
                  <select className="input" value={editTask.priority ?? 'P2'} onChange={e => setEditTask(p => ({ ...p, priority: e.target.value as Task['priority'] }))}>
                    <option value="P1">P1 — Critical</option><option value="P2">P2 — Important</option><option value="P3">P3 — Nice to Have</option>
                  </select>
                  {fieldErr('priority') && <div className="error-msg">{fieldErr('priority')}</div>}
                </div>
                <div>
                  <label className="label">Energy</label>
                  <select className="input" value={editTask.energy ?? 'medium'} onChange={e => setEditTask(p => ({ ...p, energy: e.target.value as Task['energy'] }))}>
                    <option value="high">🟢 High Focus</option><option value="medium">🟡 Medium Focus</option><option value="low">🔴 Low Focus</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Est. Minutes *</label>
                  <input type="number" className="input" value={editTask.estimated_minutes ?? 0} onChange={e => setEditTask(p => ({ ...p, estimated_minutes: Number(e.target.value) }))} min="0" />
                  {fieldErr('estimated_minutes') && <div className="error-msg">{fieldErr('estimated_minutes')}</div>}
                </div>
                <div>
                  <label className="label">Actual Minutes</label>
                  <input type="number" className="input" value={editTask.actual_minutes ?? 0} onChange={e => setEditTask(p => ({ ...p, actual_minutes: Number(e.target.value) }))} min="0" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editTask.status ?? 'todo'} onChange={e => setEditTask(p => ({ ...p, status: e.target.value as Task['status'] }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
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
                  <option value="">No goal</option>
                  {goals.filter(g => g.status === 'active').map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Link to Project</label>
                <select className="input" value={editTask.project_id ?? ''} onChange={e => setEditTask(p => ({ ...p, project_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">No project</option>
                  {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Success Criteria</label>
                <input className="input" value={editTask.success_criteria ?? ''} onChange={e => setEditTask(p => ({ ...p, success_criteria: e.target.value }))} placeholder="Done when..." />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" style={{ minHeight: 60 }} value={editTask.notes ?? ''} onChange={e => setEditTask(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            {errors.length > 0 && (
              <div style={{ marginTop: '.75rem', background: '#2a0f0f', border: '1px solid #5a2020', borderRadius: 8, padding: '.75rem' }}>
                {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--red)' }}>• {e.message}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editTask.id ? 'Save' : 'Create Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return <Suspense fallback={<div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div>}><TasksPageInner /></Suspense>;
}
