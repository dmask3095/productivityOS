'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project, Goal } from '@/lib/types';

const STATUSES = ['active', 'completed', 'on-hold', 'archived'];
const EMPTY: Partial<Project> = { name: '', goal_id: null, description: '', status: 'active', estimated_hours: 0, actual_hours: 0, deadline: '' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { goal_title?: string })[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editProj, setEditProj] = useState<Partial<Project>>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(filter === 'all' ? '/api/projects' : `/api/projects?status=${filter}`).then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
    ]).then(([p, g]) => { setProjects(Array.isArray(p) ? p : []); setGoals(Array.isArray(g) ? g : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  const openNew = () => { setEditProj({ ...EMPTY }); setShowForm(true); };
  const openEdit = (p: Project) => { setEditProj({ ...p }); setShowForm(true); };

  const save = async () => {
    if (!editProj.name?.trim()) return alert('Project name is required');
    const method = editProj.id ? 'PUT' : 'POST';
    const url = editProj.id ? `/api/projects/${editProj.id}` : '/api/projects';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editProj) });
    setShowForm(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    load();
  };

  const statusColor = (s: string) => ({ active: '#22c55e', completed: 'var(--accent)', 'on-hold': '#f59e0b', archived: 'var(--muted)' }[s] || 'var(--muted)');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Organize work under goals</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Project</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        {['all', ...STATUSES].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)} style={{ fontSize: 11, padding: '4px 12px', textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projects.length === 0 && <div style={{ color: 'var(--muted)', padding: '2rem', textAlign: 'center' }}>No projects yet. <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={openNew}>Create one →</button></div>}
          {projects.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: statusColor(p.status), background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize', marginLeft: 4 }}>{p.status}</span>
                </div>
                {p.goal_title && <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>🎯 {p.goal_title}</div>}
                {p.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
                  <span>📅 {p.deadline || '—'}</span>
                  <span>⏱ {p.estimated_hours}h est / {p.actual_hours}h actual</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Link href={`/projects/${p.id}`} className="btn btn-secondary" style={{ fontSize: 11 }}>View</Link>
                <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={() => del(p.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 800 }}>{editProj.id ? 'Edit Project' : 'New Project'}</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="label">Name *</label>
                <input className="input" value={editProj.name ?? ''} onChange={e => setEditProj(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
              </div>
              <div>
                <label className="label">Parent Goal</label>
                <select className="input" value={editProj.goal_id ?? ''} onChange={e => setEditProj(p => ({ ...p, goal_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">No parent goal</option>
                  {goals.filter(g => g.status === 'active').map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" value={editProj.description ?? ''} onChange={e => setEditProj(p => ({ ...p, description: e.target.value }))} placeholder="Project description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editProj.status ?? 'active'} onChange={e => setEditProj(p => ({ ...p, status: e.target.value as Project['status'] }))}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" className="input" value={editProj.deadline ?? ''} onChange={e => setEditProj(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Estimated Hours</label>
                  <input type="number" className="input" value={editProj.estimated_hours ?? 0} onChange={e => setEditProj(p => ({ ...p, estimated_hours: Number(e.target.value) }))} min="0" step="0.5" />
                </div>
                <div>
                  <label className="label">Actual Hours</label>
                  <input type="number" className="input" value={editProj.actual_hours ?? 0} onChange={e => setEditProj(p => ({ ...p, actual_hours: Number(e.target.value) }))} min="0" step="0.5" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editProj.id ? 'Save Changes' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
