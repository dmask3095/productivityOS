export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql, initSchema } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    await initSchema();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const goals = status
      ? await sql`SELECT * FROM goals WHERE user_id=${auth.userId} AND status=${status} ORDER BY priority ASC, deadline ASC`
      : await sql`SELECT * FROM goals WHERE user_id=${auth.userId} ORDER BY priority ASC, deadline ASC`;
    return NextResponse.json(goals);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    await initSchema();
    const b = await req.json();
    const [goal] = await sql`
      INSERT INTO goals (user_id,title,specific_goal,why,success_criteria,start_date,deadline,status,priority,dependencies,estimated_hours,actual_hours,next_action,notes)
      VALUES (${auth.userId},${b.title},${b.specific_goal},${b.why??''},${b.success_criteria},${b.start_date??''},${b.deadline},${b.status??'active'},${b.priority??'P2'},${b.dependencies??''},${b.estimated_hours??0},${b.actual_hours??0},${b.next_action??''},${b.notes??''})
      RETURNING *`;
    return NextResponse.json(goal, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
