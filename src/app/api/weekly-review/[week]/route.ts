export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ week: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { week } = await params;
  try {
    const [review] = await sql`SELECT * FROM weekly_reviews WHERE user_id=${auth.userId} AND week_start=${week}`;
    const weekEnd = new Date(week); weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const [hoursRow] = await sql`SELECT ROUND(SUM(hours)::numeric,2) as total FROM time_entries WHERE user_id=${auth.userId} AND entry_date>=${week} AND entry_date<=${weekEndStr} AND category NOT IN ('Sleep','Entertainment')`;
    const [goalsCompleted] = await sql`SELECT COUNT(*) as cnt FROM goals WHERE user_id=${auth.userId} AND status='completed' AND updated_at::date>=${week} AND updated_at::date<=${weekEndStr}`;
    const [goalsDelayed] = await sql`SELECT COUNT(*) as cnt FROM goals WHERE user_id=${auth.userId} AND status='active' AND deadline>=${week} AND deadline<=${weekEndStr}`;
    return NextResponse.json({ review: review??null, stats: { hours_worked: hoursRow?.total??0, goals_completed: Number(goalsCompleted?.cnt??0), goals_delayed: Number(goalsDelayed?.cnt??0), week_end: weekEndStr } });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
