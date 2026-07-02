'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Goal, Milestone, Task } from '@/lib/types';
import { checkDeadlineRealism } from '@/lib/validation';

const priorityClass = (p: string) => p === 'P1' ? 'badge badge-p1' : p === 'P2' ? 'badge badge-p2' : 'badge badge-p3';

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newMs, setNewMs] = useState('');
  const [msDeadline, setMsDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [g, ms, ts] = await Promise.all([
      fetch(`/api/goals/${id}`).then(r => r.json()),
      fetch(`/api/goals/${id}/milestones`).then(r => r.json()),
      fetch(`/api/tasks?goal_id=${id}`).then(r => r.json()),
    ]);
    setGoal(g); setMilestones(Array.isArray(ms) ? ms : []); setTasks(Array.isArray(ts) ? ts : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const toggleMilestone = async (ms: Milestone) => {
    await fetch(`/api/milestones/${ms.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ms, completed: ms.completed ? 0 : 1 }) });
    load();
  };

  const addMilestone = async () => {
    if (!newMs.trim()) return;
    await fetch(`/api/goals/${id}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newMs, deadline: msDeadline }) });
    setNewMs(''); setMsDeadline(''); load();
  };

  const delMilestone = async (msId: number) => {
    await fetch(`/api/milestones/${msId}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Loading...</div>;
  if (!goal || (goal as { error?: string }).error) return <div style={{ color: 'var(--red)', padding: '2rem' }}>Goal not found. <Link href="/goals">← Back</Link></div>;

  const warn = checkDeadlineRealism(goal.estimated_hours, goal.deadline);
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : goal.completion_pct;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/goals" style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'none' }}>← Goals</Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '1rem' }}>
          <span className={priorityClass(goal.priority)}>{goal.priority}</span>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{goal.title}</h1>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, textTransform: 'capitalize' }}>{goal.status}</div>
          </div>
          <Link href={`/goals?edit=${goal.id}`} className="btn btn-secondary" style={{ fontSize: 11 }}>Edit</Link>
        </div>

        {!warn.realistic && <div className="warn" style={{ marginBottom: '1rem' }}>{warn.warning}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { label: 'Specific Goal', value: goal.specific_goal },
            { label: 'Why', value: goal.why || '—' },
            { label: 'Success Criteria', value: goal.success_criteria },
            { label: 'Next Action', value: goal.next_action || '—' },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem' }}>
              <div className="label">{f.label}</div>
              <div style={{ fontSize: 13 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Start Date', value: goal.start_date || '—' },
            { label: 'Deadline', value: goal.deadline },
            { label: 'Est. Hours', value: `${goal.estimated_hours}h` },
            { label: 'Actual Hours', value: `${goal.actual_hours}h` },
            { label: 'Completion', value: `${pct}%` },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
              <div className="label">{f.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{pct}% complete ({doneTasks}/{tasks.length} tasks done)</div>

        {goal.dependencies && <div style={{ marginTop: '0.75rem', fontSize: 12, color: 'var(--muted)' }}>Dependencies: {goal.dependencies}</div>}
        {goal.notes && <div style={{ marginTop: '0.5rem', fontSize: 12, color: 'var(--muted)' }}>Notes: {goal.notes}</div>}
      </div>

      {/* Milestones */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: 15, fontWeight: 700 }}>Milestones</h2>
        {milestones.map(ms => (
          <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => toggleMilestone(ms)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--border)', background: ms.completed ? 'var(--green)' : 'transparent', cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, textDecoration: ms.completed ? 'line-through' : 'none', color: ms.completed ? 'var(--muted)' : 'var(--text)' }}>{ms.title}</span>
            {ms.deadline && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ms.deadline}</span>}
            <button onClick={() => delMilestone(ms.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
          <input className="input" value={newMs} onChange={e => setNewMs(e.target.value)} placeholder="New milestone..." onKeyDown={e => e.key === 'Enter' && addMilestone()} style={{ flex: 1 }} />
          <input type="date" className="input" value={msDeadline} onChange={e => setMsDeadline(e.target.value)} style={{ width: 150 }} />
          <button className="btn btn-primary" onClick={addMilestone}>Add</button>
        </div>
      </div>

      {/* Linked Tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tasks ({tasks.length})</h2>
          <Link href={`/tasks?goal_id=${id}`} className="btn btn-secondary" style={{ fontSize: 11 }}>Manage Tasks</Link>
        </div>
        {tasks.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No tasks linked to this goal.</div> : (
          <table>
            <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Deadline</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                  <td><span style={{ fontSize: 11, textTransform: 'capitalize' }}>{t.status.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.deadline || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
