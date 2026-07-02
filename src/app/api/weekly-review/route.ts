export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const reviews = await sql`SELECT * FROM weekly_reviews WHERE user_id=${auth.userId} ORDER BY week_start DESC`;
    return NextResponse.json(reviews);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [review] = await sql`
      INSERT INTO weekly_reviews (user_id,week_start,wins,mistakes,lessons,hours_worked,goals_completed,goals_delayed,focus_score,productivity_score,next_week_priorities)
      VALUES (${auth.userId},${b.week_start},${b.wins??''},${b.mistakes??''},${b.lessons??''},${b.hours_worked??0},${b.goals_completed??0},${b.goals_delayed??0},${b.focus_score??0},${b.productivity_score??0},${b.next_week_priorities??''})
      ON CONFLICT (user_id,week_start) DO UPDATE SET wins=${b.wins??''},mistakes=${b.mistakes??''},lessons=${b.lessons??''},hours_worked=${b.hours_worked??0},goals_completed=${b.goals_completed??0},goals_delayed=${b.goals_delayed??0},focus_score=${b.focus_score??0},productivity_score=${b.productivity_score??0},next_week_priorities=${b.next_week_priorities??''},updated_at=NOW()
      RETURNING *`;
    return NextResponse.json(review);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
