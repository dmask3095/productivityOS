import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [log] = await sql`UPDATE daily_logs SET log_date=${b.log_date},task_description=${b.task_description},goal_id=${b.goal_id??null},project_id=${b.project_id??null},time_spent_minutes=${b.time_spent_minutes??0},difficulty=${b.difficulty??3},lessons=${b.lessons??''} WHERE id=${id} AND user_id=${auth.userId} RETURNING *`;
    return NextResponse.json(log);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM daily_logs WHERE id=${id} AND user_id=${auth.userId}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
