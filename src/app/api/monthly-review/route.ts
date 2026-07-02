import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const reviews = await sql`SELECT * FROM monthly_reviews WHERE user_id=${auth.userId} ORDER BY month DESC`;
    return NextResponse.json(reviews);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [review] = await sql`
      INSERT INTO monthly_reviews (user_id,month,major_achievements,goals_completed,goals_failed,projects_finished,total_hours,biggest_distraction,improvement_plan)
      VALUES (${auth.userId},${b.month},${b.major_achievements??''},${b.goals_completed??0},${b.goals_failed??0},${b.projects_finished??0},${b.total_hours??0},${b.biggest_distraction??''},${b.improvement_plan??''})
      ON CONFLICT (user_id,month) DO UPDATE SET major_achievements=${b.major_achievements??''},goals_completed=${b.goals_completed??0},goals_failed=${b.goals_failed??0},projects_finished=${b.projects_finished??0},total_hours=${b.total_hours??0},biggest_distraction=${b.biggest_distraction??''},improvement_plan=${b.improvement_plan??''},updated_at=NOW()
      RETURNING *`;
    return NextResponse.json(review);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
