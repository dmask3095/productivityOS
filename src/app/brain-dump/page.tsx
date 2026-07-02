'use client';
import { useEffect, useState } from 'react';
import type { BrainDump } from '@/lib/types';

const TYPES: { key: BrainDump['type']; label: string; emoji: string; desc: string }[] = [
  { key: 'idea', label: 'Ideas', emoji: '💡', desc: 'Creative ideas, insights, sparks' },
  { key: 'research', label: 'Research', emoji: '🔬', desc: 'Things to investigate or learn about' },
  { key: 'business', label: 'Business Ideas', emoji: '💼', desc: 'Business opportunities, ventures' },
  { key: 'future_task', label: 'Future Tasks', emoji: '📌', desc: 'Things to do eventually' },
];

export default function BrainDumpPage() {
  const [items, setItems] = useState<BrainDump[]>([]);
  const [activeType, setActiveType] = useState<BrainDump['type']>('idea');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/brain-dump').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newContent.trim()) return;
    await fetch('/api/brain-dump', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: activeType, content: newContent }) });
    setNewContent(''); load();
  };

  const del = async (id: number) => {
    await fetch(`/api/brain-dump/${id}`, { method: 'DELETE' }); load();
  };

  const convertToTask = async (item: BrainDump) => {
    const taskRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: item.content.slice(0, 100), priority: 'P3', energy: 'medium', estimated_minutes: 60, status: 'backlog', deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }),
    });
    const task = await taskRes.json();
    await fetch(`/api/brain-dump/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, converted_task_id: task.id }) });
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Brain Dump</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 0' }}>Capture everything. Sort it later.</p>
      </div>

      {/* Type tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {TYPES.map(t => {
          const count = items.filter(i => i.type === t.key && !i.converted_task_id).length;
          return (
            <button key={t.key} onClick={() => setActiveType(t.key)}
              style={{ background: activeType === t.key ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${activeType === t.key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '0.75rem', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', transition: 'all .15s' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: activeType === t.key ? 'rgba(255,255,255,.7)' : 'var(--muted)', marginTop: 2 }}>{count} items</div>
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '0.5rem' }}>
          {TYPES.find(t => t.key === activeType)?.emoji} Adding to: <strong style={{ color: 'var(--text)' }}>{TYPES.find(t => t.key === activeType)?.label}</strong> — {TYPES.find(t => t.key === activeType)?.desc}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea className="input" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={`Dump your ${activeType.replace('_', ' ')} here...`} style={{ minHeight: 80 }}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) add(); }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Ctrl+Enter to add</span>
          <button className="btn btn-primary" onClick={add}>Add →</button>
        </div>
      </div>

      {/* Items list */}
      {loading ? <div style={{ color: 'var(--muted)', padding: '1rem' }}>Loading...</div> : (
        <div>
          {TYPES.map(t => {
            const typeItems = items.filter(i => i.type === t.key);
            if (typeItems.length === 0) return null;
            return (
              <div key={t.key} style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: '.5rem', color: activeType === t.key ? 'var(--accent)' : 'var(--text)' }}>
                  {t.emoji} {t.label} ({typeItems.filter(i => !i.converted_task_id).length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {typeItems.map(item => (
                    <div key={item.id} className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: item.converted_task_id ? 0.55 : 1, padding: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{item.content}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                          {new Date(item.created_at).toLocaleDateString()}
                          {item.converted_task_id && <span style={{ marginLeft: 8, color: 'var(--green)' }}>✓ Converted to task #{item.converted_task_id}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!item.converted_task_id && (
                          <button className="btn btn-success" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => convertToTask(item)}>→ Task</button>
                        )}
                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => del(item.id)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Empty. Start dumping your thoughts above ↑</div>
          )}
        </div>
      )}
    </div>
  );
}
