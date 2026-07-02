import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const logs = date
      ? await sql`SELECT dl.*,g.title as goal_title,p.name as project_name FROM daily_logs dl LEFT JOIN goals g ON dl.goal_id=g.id LEFT JOIN projects p ON dl.project_id=p.id WHERE dl.user_id=${auth.userId} AND dl.log_date=${date} ORDER BY dl.id DESC`
      : await sql`SELECT dl.*,g.title as goal_title,p.name as project_name FROM daily_logs dl LEFT JOIN goals g ON dl.goal_id=g.id LEFT JOIN projects p ON dl.project_id=p.id WHERE dl.user_id=${auth.userId} ORDER BY dl.log_date DESC, dl.id DESC`;
    return NextResponse.json(logs);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [log] = await sql`INSERT INTO daily_logs (user_id,log_date,task_description,goal_id,project_id,time_spent_minutes,difficulty,lessons) VALUES (${auth.userId},${b.log_date},${b.task_description},${b.goal_id??null},${b.project_id??null},${b.time_spent_minutes??0},${b.difficulty??3},${b.lessons??''}) RETURNING *`;
    return NextResponse.json(log, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
