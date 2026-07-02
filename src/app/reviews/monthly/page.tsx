'use client';
import { useEffect, useState } from 'react';

interface MonthReview {
  month: string;
  major_achievements: string;
  goals_completed: number;
  goals_failed: number;
  projects_finished: number;
  total_hours: number;
  biggest_distraction: string;
  improvement_plan: string;
}

export default function MonthlyReviewPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [review, setReview] = useState<Partial<MonthReview>>({});
  const [stats, setStats] = useState<Partial<{ total_hours: number; goals_completed: number; goals_failed: number; projects_finished: number }>>({});
  const [allReviews, setAllReviews] = useState<MonthReview[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, all] = await Promise.all([
      fetch(`/api/monthly-review/${month}`).then(r => r.json()),
      fetch('/api/monthly-review').then(r => r.json()),
    ]);
    if (d.review) setReview(d.review);
    else setReview({ major_achievements: '', goals_completed: d.stats?.goals_completed ?? 0, goals_failed: d.stats?.goals_failed ?? 0, projects_finished: d.stats?.projects_finished ?? 0, total_hours: d.stats?.total_hours ?? 0, biggest_distraction: '', improvement_plan: '' });
    setStats(d.stats ?? {});
    setAllReviews(Array.isArray(all) ? all : []);
  };

  useEffect(() => { load(); }, [month]);

  const autoFill = () => {
    setReview(p => ({ ...p, total_hours: stats.total_hours ?? 0, goals_completed: stats.goals_completed ?? 0, goals_failed: stats.goals_failed ?? 0, projects_finished: stats.projects_finished ?? 0 }));
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/monthly-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...review, month }) });
    setSaving(false); load();
  };

  const navMonth = (dir: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, flex: 1 }}>Monthly Review</h1>
          <button className="btn btn-secondary" onClick={() => navMonth(-1)}>← Prev</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{month}</span>
          <button className="btn btn-secondary" onClick={() => navMonth(1)}>Next →</button>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📊 Auto-Generated Stats</h2>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={autoFill}>↓ Fill into form</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Total Hours', value: `${(stats.total_hours ?? 0).toFixed(1)}h` },
              { label: 'Goals Completed', value: stats.goals_completed ?? 0 },
              { label: 'Goals Failed', value: stats.goals_failed ?? 0 },
              { label: 'Projects Finished', value: stats.projects_finished ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">🏆 Major Achievements</label>
              <textarea className="input" style={{ minHeight: 100 }} value={review.major_achievements ?? ''} onChange={e => setReview(p => ({ ...p, major_achievements: e.target.value }))} placeholder="What were your biggest wins this month?" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Goals Completed', field: 'goals_completed' },
                { label: 'Goals Failed', field: 'goals_failed' },
                { label: 'Projects Finished', field: 'projects_finished' },
                { label: 'Total Hours', field: 'total_hours' },
              ].map(f => (
                <div key={f.field}>
                  <label className="label">{f.label}</label>
                  <input type="number" className="input" value={(review as Record<string, number>)[f.field] ?? 0} onChange={e => setReview(p => ({ ...p, [f.field]: Number(e.target.value) }))} min="0" step={f.field === 'total_hours' ? '0.5' : '1'} />
                </div>
              ))}
            </div>
            <div>
              <label className="label">📵 Biggest Distraction</label>
              <textarea className="input" style={{ minHeight: 70 }} value={review.biggest_distraction ?? ''} onChange={e => setReview(p => ({ ...p, biggest_distraction: e.target.value }))} placeholder="What cost you the most time or focus this month?" />
            </div>
            <div>
              <label className="label">🔧 Improvement Plan</label>
              <textarea className="input" style={{ minHeight: 100 }} value={review.improvement_plan ?? ''} onChange={e => setReview(p => ({ ...p, improvement_plan: e.target.value }))} placeholder="What will you change next month?" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save Review'}</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: 13, fontWeight: 700 }}>Past Reviews</h3>
        {allReviews.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No reviews yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allReviews.map(r => (
              <button key={r.month} className={`btn ${r.month === month ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 11 }} onClick={() => setMonth(r.month)}>{r.month}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
