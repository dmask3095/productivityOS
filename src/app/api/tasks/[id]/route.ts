export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const [task] = await sql`SELECT * FROM tasks WHERE id=${id} AND user_id=${auth.userId}`;
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const completedAt = b.status === 'done' ? new Date().toISOString() : '';
    const [task] = await sql`
      UPDATE tasks SET title=${b.title},goal_id=${b.goal_id??null},project_id=${b.project_id??null},
        priority=${b.priority},energy=${b.energy},estimated_minutes=${b.estimated_minutes??0},
        actual_minutes=${b.actual_minutes??0},status=${b.status},deadline=${b.deadline??''},
        success_criteria=${b.success_criteria??''},notes=${b.notes??''},
        completed_at=${completedAt},updated_at=NOW()
      WHERE id=${id} AND user_id=${auth.userId} RETURNING *`;
    return NextResponse.json(task);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM tasks WHERE id=${id} AND user_id=${auth.userId}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
