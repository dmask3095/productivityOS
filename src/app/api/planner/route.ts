export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (date) {
      const [plan] = await sql`SELECT * FROM daily_plans WHERE user_id=${auth.userId} AND plan_date=${date}`;
      const blocks = await sql`SELECT * FROM deep_work_blocks WHERE user_id=${auth.userId} AND plan_date=${date} ORDER BY id ASC`;
      return NextResponse.json({ plan: plan ?? null, blocks });
    }
    const plans = await sql`SELECT * FROM daily_plans WHERE user_id=${auth.userId} ORDER BY plan_date DESC LIMIT 30`;
    return NextResponse.json(plans);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const qt = JSON.stringify(b.quick_tasks ?? []);
    const [existing] = await sql`SELECT id FROM daily_plans WHERE user_id=${auth.userId} AND plan_date=${b.plan_date}`;
    let plan;
    if (existing) {
      [plan] = await sql`UPDATE daily_plans SET top_priority_1=${b.top_priority_1??''},top_priority_2=${b.top_priority_2??''},top_priority_3=${b.top_priority_3??''},meetings=${b.meetings??''},quick_tasks=${qt},notes=${b.notes??''} WHERE user_id=${auth.userId} AND plan_date=${b.plan_date} RETURNING *`;
    } else {
      [plan] = await sql`INSERT INTO daily_plans (user_id,plan_date,top_priority_1,top_priority_2,top_priority_3,meetings,quick_tasks,notes) VALUES (${auth.userId},${b.plan_date},${b.top_priority_1??''},${b.top_priority_2??''},${b.top_priority_3??''},${b.meetings??''},${qt},${b.notes??''}) RETURNING *`;
    }
    return NextResponse.json(plan);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
