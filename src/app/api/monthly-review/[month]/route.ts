export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ month: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { month } = await params;
  try {
    const [review] = await sql`SELECT * FROM monthly_reviews WHERE user_id=${auth.userId} AND month=${month}`;
    const [hoursRow] = await sql`SELECT ROUND(SUM(hours)::numeric,2) as total FROM time_entries WHERE user_id=${auth.userId} AND TO_CHAR(entry_date::date,'YYYY-MM')=${month}`;
    const [goalsCompleted] = await sql`SELECT COUNT(*) as cnt FROM goals WHERE user_id=${auth.userId} AND status='completed' AND TO_CHAR(updated_at,'YYYY-MM')=${month}`;
    const [goalsFailed] = await sql`SELECT COUNT(*) as cnt FROM goals WHERE user_id=${auth.userId} AND status='failed' AND TO_CHAR(updated_at,'YYYY-MM')=${month}`;
    const [projectsFinished] = await sql`SELECT COUNT(*) as cnt FROM projects WHERE user_id=${auth.userId} AND status='completed' AND TO_CHAR(updated_at,'YYYY-MM')=${month}`;
    return NextResponse.json({ review: review??null, stats: { total_hours: hoursRow?.total??0, goals_completed: Number(goalsCompleted?.cnt??0), goals_failed: Number(goalsFailed?.cnt??0), projects_finished: Number(projectsFinished?.cnt??0) } });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
