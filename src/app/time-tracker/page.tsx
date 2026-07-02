'use client';
import { useEffect, useState } from 'react';

const CATEGORIES = ['Deep Work', 'Coding', 'Learning', 'Reading', 'Exercise', 'Meetings', 'Entertainment', 'Sleep'];
const CAT_COLORS: Record<string, string> = {
  'Deep Work': '#7c6af5', 'Coding': '#5b8cff', 'Learning': '#22c55e', 'Reading': '#06b6d4',
  'Exercise': '#f59e0b', 'Meetings': '#ef4444', 'Entertainment': '#ec4899', 'Sleep': '#8b5cf6',
};

interface Entry { id: number; entry_date: string; category: string; hours: number; notes: string }

export default function TimeTrackerPage() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const [date, setDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [monthTotals, setMonthTotals] = useState<{ category: string; total_hours: number }[]>([]);
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadDay = () => {
    fetch(`/api/time-tracker?date=${date}`).then(r => r.json()).then((data: Entry[]) => {
      setEntries(Array.isArray(data) ? data : []);
      const map: Record<string, string> = {};
      if (Array.isArray(data)) data.forEach(e => { map[e.category] = String(e.hours); });
      setHours(map);
    });
  };

  const loadMonth = () => {
    fetch(`/api/time-tracker?aggregate=category&month=${viewMonth}`).then(r => r.json()).then(data => {
      setMonthTotals(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => { loadDay(); }, [date]);
  useEffect(() => { loadMonth(); }, [viewMonth]);

  const saveDay = async () => {
    setSaving(true);
    await Promise.all(
      CATEGORIES.map(cat => {
        const h = parseFloat(hours[cat] || '0');
        if (h > 0) return fetch('/api/time-tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry_date: date, category: cat, hours: h }) });
        return Promise.resolve();
      })
    );
    setSaving(false); loadDay(); loadMonth();
  };

  const del = async (id: number) => {
    await fetch(`/api/time-tracker/${id}`, { method: 'DELETE' }); loadDay(); loadMonth();
  };

  const totalToday = Object.values(hours).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const maxMonth = Math.max(...monthTotals.map(m => m.total_hours), 1);

  const navMonth = (dir: number) => {
    const [y, m] = viewMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 1.25rem' }}>Time Tracker</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Daily Logger */}
        <div className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, flex: 1 }}>Log Hours for Date</h2>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 145 }} />
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[cat], flexShrink: 0 }} />
                <label style={{ flex: 1, fontSize: 13 }}>{cat}</label>
                <input type="number" className="input" value={hours[cat] ?? ''} onChange={e => setHours(p => ({ ...p, [cat]: e.target.value }))} min="0" max="24" step="0.25" placeholder="0" style={{ width: 70, textAlign: 'right' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)', width: 14 }}>h</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total: <span style={{ color: 'var(--accent)' }}>{totalToday.toFixed(1)}h</span> / 24h</span>
            <button className="btn btn-primary" onClick={saveDay} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem' }}>
            <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => navMonth(-1)}>←</button>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, flex: 1, textAlign: 'center' }}>{viewMonth}</h2>
            <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => navMonth(1)}>→</button>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {CATEGORIES.map(cat => {
              const row = monthTotals.find(m => m.category === cat);
              const h = row?.total_hours ?? 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat], display: 'inline-block' }} /> {cat}
                    </span>
                    <span style={{ color: 'var(--muted)' }}>{h.toFixed(1)}h</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', background: CAT_COLORS[cat], borderRadius: 99, width: `${(h / maxMonth) * 100}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
            Total: <span style={{ color: 'var(--accent)' }}>{monthTotals.reduce((s, m) => s + m.total_hours, 0).toFixed(1)}h</span>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: 14, fontWeight: 700 }}>Saved Entries for {date}</h2>
          <table>
            <thead><tr><th>Category</th><th>Hours</th><th></th></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[e.category], display: 'inline-block' }} /> {e.category}
                  </td>
                  <td>{e.hours}h</td>
                  <td><button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => del(e.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
