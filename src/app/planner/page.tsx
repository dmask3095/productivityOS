'use client';
import { useEffect, useState } from 'react';

interface QuickTask { text: string; completed: boolean }
interface Block { id: number; time_label: string; task_description: string; completed: number }
interface Plan {
  plan_date: string;
  top_priority_1: string;
  top_priority_2: string;
  top_priority_3: string;
  meetings: string;
  quick_tasks: string;
  notes: string;
}

export default function PlannerPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [plan, setPlan] = useState<Partial<Plan>>({ plan_date: today, top_priority_1: '', top_priority_2: '', top_priority_3: '', meetings: '', quick_tasks: '[]', notes: '' });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>([]);
  const [newBlock, setNewBlock] = useState({ time_label: '', task_description: '' });
  const [newQT, setNewQT] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/planner?date=${date}`).then(r => r.json()).then(d => {
      if (d.plan) {
        setPlan(d.plan);
        try { setQuickTasks(JSON.parse(d.plan.quick_tasks || '[]')); } catch { setQuickTasks([]); }
      } else {
        setPlan({ plan_date: date, top_priority_1: '', top_priority_2: '', top_priority_3: '', meetings: '', quick_tasks: '[]', notes: '' });
        setQuickTasks([]);
      }
      setBlocks(d.blocks || []);
    });
  };

  useEffect(() => { load(); }, [date]);

  const save = async () => {
    setSaving(true);
    await fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...plan, plan_date: date, quick_tasks: quickTasks }) });
    setSaving(false);
  };

  const addBlock = async () => {
    if (!newBlock.time_label && !newBlock.task_description) return;
    await fetch(`/api/planner/${date}/deep-work`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBlock) });
    setNewBlock({ time_label: '', task_description: '' }); load();
  };

  const toggleBlock = async (b: Block) => {
    await fetch(`/api/deep-work/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, completed: b.completed ? 0 : 1 }) });
    load();
  };

  const delBlock = async (id: number) => {
    await fetch(`/api/deep-work/${id}`, { method: 'DELETE' }); load();
  };

  const addQT = () => {
    if (!newQT.trim()) return;
    const updated = [...quickTasks, { text: newQT, completed: false }];
    setQuickTasks(updated); setNewQT('');
    fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...plan, plan_date: date, quick_tasks: updated }) });
  };

  const toggleQT = (i: number) => {
    const updated = quickTasks.map((qt, idx) => idx === i ? { ...qt, completed: !qt.completed } : qt);
    setQuickTasks(updated);
    fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...plan, plan_date: date, quick_tasks: updated }) });
  };

  const navDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Daily Planner</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navDate(-1)}>← Prev</button>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 145 }} />
          <button className="btn btn-secondary" onClick={() => navDate(1)}>Next →</button>
          <button className="btn btn-secondary" onClick={() => setDate(today)}>Today</button>
        </div>
      </div>

      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.25rem' }}>{displayDate}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Top 3 Priorities */}
        <div className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>🎯 Top 3 Priorities</h2>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</span>
              <input className="input" value={(plan as Record<string, string>)[`top_priority_${n}`] ?? ''} onChange={e => setPlan(p => ({ ...p, [`top_priority_${n}`]: e.target.value }))} placeholder={`Priority ${n}`} />
            </div>
          ))}
        </div>

        {/* Quick Tasks */}
        <div className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>⚡ Quick Tasks</h2>
          {quickTasks.map((qt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <button onClick={() => toggleQT(i)} style={{ width: 16, height: 16, borderRadius: 3, border: '2px solid var(--border)', background: qt.completed ? 'var(--green)' : 'transparent', cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ fontSize: 13, textDecoration: qt.completed ? 'line-through' : 'none', color: qt.completed ? 'var(--muted)' : 'var(--text)', flex: 1 }}>{qt.text}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input className="input" value={newQT} onChange={e => setNewQT(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQT()} placeholder="Add quick task..." />
            <button className="btn btn-primary" onClick={addQT}>+</button>
          </div>
        </div>
      </div>

      {/* Deep Work Blocks */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>🧠 Deep Work Blocks</h2>
        <table>
          <thead><tr><th>Time</th><th>Task</th><th>Done</th><th></th></tr></thead>
          <tbody>
            {blocks.map(b => (
              <tr key={b.id}>
                <td style={{ fontSize: 13, width: 140 }}>{b.time_label || '—'}</td>
                <td style={{ fontSize: 13, textDecoration: b.completed ? 'line-through' : 'none', color: b.completed ? 'var(--muted)' : 'var(--text)' }}>{b.task_description}</td>
                <td>
                  <button onClick={() => toggleBlock(b)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--border)', background: b.completed ? 'var(--green)' : 'transparent', cursor: 'pointer' }} />
                </td>
                <td><button onClick={() => delBlock(b.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button></td>
              </tr>
            ))}
            <tr>
              <td><input className="input" value={newBlock.time_label} onChange={e => setNewBlock(p => ({ ...p, time_label: e.target.value }))} placeholder="9:00 - 11:00" style={{ fontSize: 12 }} /></td>
              <td><input className="input" value={newBlock.task_description} onChange={e => setNewBlock(p => ({ ...p, task_description: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addBlock()} placeholder="What will you work on?" style={{ fontSize: 12 }} /></td>
              <td /><td><button className="btn btn-primary" style={{ fontSize: 11 }} onClick={addBlock}>+</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Meetings & Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>📞 Meetings</h2>
          <textarea className="input" style={{ minHeight: 100 }} value={plan.meetings ?? ''} onChange={e => setPlan(p => ({ ...p, meetings: e.target.value }))} placeholder="Meeting notes..." />
        </div>
        <div className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>📝 Notes</h2>
          <textarea className="input" style={{ minHeight: 100 }} value={plan.notes ?? ''} onChange={e => setPlan(p => ({ ...p, notes: e.target.value }))} placeholder="Daily notes..." />
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save Plan'}</button>
      </div>
    </div>
  );
}
