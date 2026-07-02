'use client';
import { useEffect, useState } from 'react';

interface Review {
  week_start: string;
  wins: string;
  mistakes: string;
  lessons: string;
  hours_worked: number;
  goals_completed: number;
  goals_delayed: number;
  focus_score: number;
  productivity_score: number;
  next_week_priorities: string;
}

function getMondayOf(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function WeeklyReviewPage() {
  const today = new Date().toISOString().split('T')[0];
  const [weekStart, setWeekStart] = useState(getMondayOf(today));
  const [review, setReview] = useState<Partial<Review>>({ wins: '', mistakes: '', lessons: '', hours_worked: 0, goals_completed: 0, goals_delayed: 0, focus_score: 5, productivity_score: 5, next_week_priorities: '' });
  const [stats, setStats] = useState<Partial<{ hours_worked: number; goals_completed: number; goals_delayed: number; week_end: string }>>({});
  const [saving, setSaving] = useState(false);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const load = async () => {
    const [d, all] = await Promise.all([
      fetch(`/api/weekly-review/${weekStart}`).then(r => r.json()),
      fetch('/api/weekly-review').then(r => r.json()),
    ]);
    if (d.review) setReview(d.review);
    else setReview({ wins: '', mistakes: '', lessons: '', hours_worked: d.stats?.hours_worked ?? 0, goals_completed: d.stats?.goals_completed ?? 0, goals_delayed: d.stats?.goals_delayed ?? 0, focus_score: 5, productivity_score: 5, next_week_priorities: '' });
    setStats(d.stats ?? {});
    setAllReviews(Array.isArray(all) ? all : []);
  };

  useEffect(() => { load(); }, [weekStart]);

  const autoFill = () => { setReview(p => ({ ...p, hours_worked: stats.hours_worked ?? 0, goals_completed: stats.goals_completed ?? 0, goals_delayed: stats.goals_delayed ?? 0 })); };

  const save = async () => {
    setSaving(true);
    await fetch('/api/weekly-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...review, week_start: weekStart }) });
    setSaving(false); load();
  };

  const navWeek = (n: number) => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + n * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const ScoreInput = ({ label, field }: { label: string; field: 'focus_score' | 'productivity_score' }) => (
    <div>
      <label className="label">{label}</label>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button key={n} onClick={() => setReview(p => ({ ...p, [field]: n }))}
            style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border)', background: (review[field] ?? 0) >= n ? 'var(--accent)' : 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{n}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem' }}>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, flex: 1 }}>Weekly Review</h1>
          <button className="btn btn-secondary" onClick={() => navWeek(-1)}>← Prev</button>
          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{weekStart} → {stats.week_end || '...'}</span>
          <button className="btn btn-secondary" onClick={() => navWeek(1)}>Next →</button>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📊 Auto-Generated Stats</h2>
            <button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={autoFill}>↓ Fill into form</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Hours Worked', value: `${(stats.hours_worked ?? 0).toFixed(1)}h` },
              { label: 'Goals Completed', value: stats.goals_completed ?? 0 },
              { label: 'Goals Delayed', value: stats.goals_delayed ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">🏆 Wins</label>
              <textarea className="input" style={{ minHeight: 80 }} value={review.wins ?? ''} onChange={e => setReview(p => ({ ...p, wins: e.target.value }))} placeholder="What went well this week?" />
            </div>
            <div>
              <label className="label">❌ Mistakes & What Went Wrong</label>
              <textarea className="input" style={{ minHeight: 80 }} value={review.mistakes ?? ''} onChange={e => setReview(p => ({ ...p, mistakes: e.target.value }))} placeholder="What didn't go well?" />
            </div>
            <div>
              <label className="label">💡 Lessons Learned</label>
              <textarea className="input" style={{ minHeight: 80 }} value={review.lessons ?? ''} onChange={e => setReview(p => ({ ...p, lessons: e.target.value }))} placeholder="Key takeaways from this week..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Hours Worked</label>
                <input type="number" className="input" value={review.hours_worked ?? 0} onChange={e => setReview(p => ({ ...p, hours_worked: Number(e.target.value) }))} min="0" step="0.5" />
              </div>
              <div>
                <label className="label">Goals Completed</label>
                <input type="number" className="input" value={review.goals_completed ?? 0} onChange={e => setReview(p => ({ ...p, goals_completed: Number(e.target.value) }))} min="0" />
              </div>
              <div>
                <label className="label">Goals Delayed</label>
                <input type="number" className="input" value={review.goals_delayed ?? 0} onChange={e => setReview(p => ({ ...p, goals_delayed: Number(e.target.value) }))} min="0" />
              </div>
            </div>
            <ScoreInput label="Focus Score (1–10)" field="focus_score" />
            <ScoreInput label="Productivity Score (1–10)" field="productivity_score" />
            <div>
              <label className="label">📋 Next Week Priorities</label>
              <textarea className="input" style={{ minHeight: 80 }} value={review.next_week_priorities ?? ''} onChange={e => setReview(p => ({ ...p, next_week_priorities: e.target.value }))} placeholder="What are your top priorities for next week?" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save Review'}</button>
          </div>
        </div>
      </div>

      {/* Past Reviews */}
      <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 0 }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: 13, fontWeight: 700 }}>Past Reviews</h3>
        {allReviews.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No reviews yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allReviews.slice(0, 12).map(r => (
              <button key={r.week_start} className={`btn ${r.week_start === weekStart ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 11, textAlign: 'left', justifyContent: 'flex-start' }} onClick={() => setWeekStart(r.week_start)}>
                {r.week_start} <span style={{ marginLeft: 'auto', opacity: .7 }}>📊 {(r.focus_score + r.productivity_score) / 2}/10</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
