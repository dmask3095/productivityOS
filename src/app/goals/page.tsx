'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { validateSmartGoal, checkDeadlineRealism } from '@/lib/validation';
import type { Goal } from '@/lib/types';

const STATUSES = ['active', 'completed', 'failed', 'archived'];
const PRIORITIES = ['P1', 'P2', 'P3'];
const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';
const statusColor = (s: string) => s === 'active' ? '#22c55e' : s === 'completed' ? 'var(--accent)' : s === 'failed' ? 'var(--red)' : 'var(--muted)';

const EMPTY: Partial<Goal> = { title: '', specific_goal: '', why: '', success_criteria: '', start_date: '', deadline: '', status: 'active', priority: 'P2', dependencies: '', estimated_hours: 0, actual_hours: 0, next_action: '', notes: '' };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Partial<Goal>>(EMPTY);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const url = filter === 'all' ? '/api/goals' : `/api/goals?status=${filter}`;
    fetch(url).then(r => r.json()).then(d => { setGoals(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  const openNew = () => { setEditGoal({ ...EMPTY }); setErrors([]); setShowForm(true); };
  const openEdit = (g: Goal) => { setEditGoal({ ...g }); setErrors([]); setShowForm(true); };

  const save = async () => {
    const v = validateSmartGoal(editGoal as Parameters<typeof validateSmartGoal>[0]);
    if (!v.valid) { setErrors(v.errors); return; }
    setErrors([]);
    setSaving(true);
    const method = editGoal.id ? 'PUT' : 'POST';
    const url = editGoal.id ? `/api/goals/${editGoal.id}` : '/api/goals';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editGoal) });
    setSaving(false);
    setShowForm(false);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete this goal and all linked data?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    load();
  };

  const deadlineWarn = editGoal.estimated_hours && editGoal.deadline
    ? checkDeadlineRealism(Number(editGoal.estimated_hours), editGoal.deadline)
    : null;

  const fieldErr = (field: string) => errors.find(e => e.field === field)?.message;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Master Goals</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>All goals follow SMART principles</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Goal</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        {['active', 'completed', 'failed', 'archived', 'all'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)} style={{ fontSize: 11, padding: '4px 12px', textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {goals.length === 0 && <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No goals yet. <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={openNew}>Create your first SMART goal →</button></div>}
          {goals.map(g => (
            <div key={g.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={priorityClass(g.priority)}>{g.priority}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{g.title}</span>
                  <span style={{ fontSize: 11, color: statusColor(g.status), marginLeft: 'auto', textTransform: 'capitalize', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6 }}>{g.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{g.specific_goal}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="progress-bar" style={{ flex: 1, minWidth: 100, maxWidth: 200 }}>
                    <div className="progress-fill" style={{ width: `${g.completion_pct}%` }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g.completion_pct}%</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>📅 {g.deadline || '—'}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>⏱ {g.estimated_hours}h est</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Link href={`/goals/${g.id}`} className="btn btn-secondary" style={{ fontSize: 11 }}>View</Link>
                <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => openEdit(g)}>Edit</button>
                <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={() => del(g.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 800 }}>{editGoal.id ? 'Edit Goal' : 'New SMART Goal'}</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="label">Title *</label>
                <input className="input" value={editGoal.title ?? ''} onChange={e => setEditGoal(p => ({ ...p, title: e.target.value }))} placeholder="Goal title" />
                {fieldErr('title') && <div className="error-msg">{fieldErr('title')}</div>}
              </div>
              <div>
                <label className="label">Specific Goal (S) — Be precise *</label>
                <textarea className="input" value={editGoal.specific_goal ?? ''} onChange={e => setEditGoal(p => ({ ...p, specific_goal: e.target.value }))} placeholder="Exactly what do you want to achieve? (min 20 chars)" />
                {fieldErr('specific_goal') && <div className="error-msg">{fieldErr('specific_goal')}</div>}
              </div>
              <div>
                <label className="label">Why — Your motivation</label>
                <textarea className="input" style={{ minHeight: 60 }} value={editGoal.why ?? ''} onChange={e => setEditGoal(p => ({ ...p, why: e.target.value }))} placeholder="Why does this goal matter?" />
              </div>
              <div>
                <label className="label">Success Criteria (M) — Measurable *</label>
                <textarea className="input" style={{ minHeight: 60 }} value={editGoal.success_criteria ?? ''} onChange={e => setEditGoal(p => ({ ...p, success_criteria: e.target.value }))} placeholder="How will you know you succeeded? (numbers, metrics)" />
                {fieldErr('success_criteria') && <div className="error-msg">{fieldErr('success_criteria')}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Priority *</label>
                  <select className="input" value={editGoal.priority ?? 'P2'} onChange={e => setEditGoal(p => ({ ...p, priority: e.target.value as 'P1' | 'P2' | 'P3' }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p} {p === 'P1' ? '— Critical' : p === 'P2' ? '— Important' : '— Nice to Have'}</option>)}
                  </select>
                  {fieldErr('priority') && <div className="error-msg">{fieldErr('priority')}</div>}
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editGoal.status ?? 'active'} onChange={e => setEditGoal(p => ({ ...p, status: e.target.value as Goal['status'] }))}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={editGoal.start_date ?? ''} onChange={e => setEditGoal(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Deadline (T) *</label>
                  <input type="date" className="input" value={editGoal.deadline ?? ''} onChange={e => setEditGoal(p => ({ ...p, deadline: e.target.value }))} />
                  {fieldErr('deadline') && <div className="error-msg">{fieldErr('deadline')}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Estimated Hours</label>
                  <input type="number" className="input" value={editGoal.estimated_hours ?? 0} onChange={e => setEditGoal(p => ({ ...p, estimated_hours: Number(e.target.value) }))} min="0" step="0.5" />
                </div>
                <div>
                  <label className="label">Actual Hours</label>
                  <input type="number" className="input" value={editGoal.actual_hours ?? 0} onChange={e => setEditGoal(p => ({ ...p, actual_hours: Number(e.target.value) }))} min="0" step="0.5" />
                </div>
              </div>
              {deadlineWarn && !deadlineWarn.realistic && <div className="warn">{deadlineWarn.warning}</div>}
              <div>
                <label className="label">Dependencies</label>
                <input className="input" value={editGoal.dependencies ?? ''} onChange={e => setEditGoal(p => ({ ...p, dependencies: e.target.value }))} placeholder="What needs to happen first?" />
              </div>
              <div>
                <label className="label">Next Action</label>
                <input className="input" value={editGoal.next_action ?? ''} onChange={e => setEditGoal(p => ({ ...p, next_action: e.target.value }))} placeholder="What is the very next step?" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" value={editGoal.notes ?? ''} onChange={e => setEditGoal(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
            </div>
            {errors.length > 0 && (
              <div style={{ marginTop: '.75rem', background: '#2a0f0f', border: '1px solid #5a2020', borderRadius: 8, padding: '.75rem' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Fix these issues before saving:</div>
                {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--red)' }}>• {e.message}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editGoal.id ? 'Save Changes' : 'Create Goal'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
