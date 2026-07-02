export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const [goal] = await sql`SELECT * FROM goals WHERE id=${id} AND user_id=${auth.userId}`;
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(goal);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [goal] = await sql`
      UPDATE goals SET title=${b.title},specific_goal=${b.specific_goal},why=${b.why??''},success_criteria=${b.success_criteria},
        start_date=${b.start_date??''},deadline=${b.deadline},status=${b.status},priority=${b.priority},
        dependencies=${b.dependencies??''},estimated_hours=${b.estimated_hours??0},actual_hours=${b.actual_hours??0},
        completion_pct=${b.completion_pct??0},next_action=${b.next_action??''},notes=${b.notes??''},updated_at=NOW()
      WHERE id=${id} AND user_id=${auth.userId} RETURNING *`;
    return NextResponse.json(goal);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM goals WHERE id=${id} AND user_id=${auth.userId}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
