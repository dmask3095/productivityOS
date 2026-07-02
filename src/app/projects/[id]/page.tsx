'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Project, Task } from '@/lib/types';
import { validateTask, formatMinutes } from '@/lib/validation';

const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';
const EMPTY_TASK: Partial<Task> = { title: '', priority: 'P2', energy: 'medium', estimated_minutes: 0, status: 'todo', deadline: '', success_criteria: '' };

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ project: Project & { goal_title?: string }; tasks: Task[] } | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Partial<Task>>(EMPTY_TASK);
  const [taskErrors, setTaskErrors] = useState<{ field: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const openTask = (t?: Task) => { setEditTask(t ? { ...t } : { ...EMPTY_TASK, project_id: Number(id) }); setTaskErrors([]); setShowTaskForm(true); };

  const saveTask = async () => {
    const v = validateTask(editTask as Parameters<typeof validateTask>[0]);
    if (!v.valid) { setTaskErrors(v.errors); return; }
    const method = editTask.id ? 'PUT' : 'POST';
    const url = editTask.id ? `/api/tasks/${editTask.id}` : '/api/tasks';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editTask, project_id: Number(id) }) });
    setShowTaskForm(false); load();
  };

  const updateStatus = async (task: Task, status: Task['status']) => {
    await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task, status }) });
    load();
  };

  const delTask = async (taskId: number) => {
    if (!confirm('Delete task?')) return;
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div>;
  if (!data) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Not found. <Link href="/projects">← Back</Link></div>;

  const { project, tasks } = data;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const fieldErr = (f: string) => taskErrors.find(e => e.field === f)?.message;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}><Link href="/projects" style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'none' }}>← Projects</Link></div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{project.name}</h1>
            {project.goal_title && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>🎯 {project.goal_title}</div>}
          </div>
          <span style={{ fontSize: 11, textTransform: 'capitalize', background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>{project.status}</span>
        </div>
        {project.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem' }}>{project.description}</div>}
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--muted)', marginBottom: '0.75rem' }}>
          <span>📅 {project.deadline || '—'}</span>
          <span>⏱ {project.estimated_hours}h est / {project.actual_hours}h actual</span>
          <span>✓ {done}/{tasks.length} tasks done</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{pct}% complete</div>
      </div>

      {/* Tasks Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tasks</h2>
          <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={() => openTask()}>+ Add Task</button>
        </div>
        {tasks.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No tasks yet.</div> : (
          <table>
            <thead>
              <tr><th>Task</th><th>Priority</th><th>Est. Time</th><th>Actual</th><th>Status</th><th>Deadline</th><th></th></tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.estimated_minutes)}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{formatMinutes(t.actual_minutes)}</td>
                  <td>
                    <select style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', padding: '2px 4px' }}
                      value={t.status} onChange={e => updateStatus(t, e.target.value as Task['status'])}>
                      {['todo', 'in_progress', 'done', 'backlog', 'someday', 'archived'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.deadline || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => openTask(t)}>Edit</button>
                      <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => delTask(t.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showTaskForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowTaskForm(false); }}>
          <div className="modal">
            <h2 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 800 }}>{editTask.id ? 'Edit Task' : 'Add Task'}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" value={editTask.title ?? ''} onChange={e => setEditTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
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
                    {['todo', 'in_progress', 'done', 'backlog', 'someday', 'archived'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Deadline *</label>
                  <input type="date" className="input" value={editTask.deadline ?? ''} onChange={e => setEditTask(p => ({ ...p, deadline: e.target.value }))} />
                  {fieldErr('deadline') && <div className="error-msg">{fieldErr('deadline')}</div>}
                </div>
              </div>
              <div>
                <label className="label">Success Criteria</label>
                <input className="input" value={editTask.success_criteria ?? ''} onChange={e => setEditTask(p => ({ ...p, success_criteria: e.target.value }))} placeholder="How will you know this task is complete?" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTask}>{editTask.id ? 'Save' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
