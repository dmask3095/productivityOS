export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const [project] = await sql`SELECT p.*,g.title as goal_title FROM projects p LEFT JOIN goals g ON p.goal_id=g.id WHERE p.id=${id} AND p.user_id=${auth.userId}`;
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const tasks = await sql`SELECT * FROM tasks WHERE project_id=${id} AND user_id=${auth.userId} ORDER BY priority ASC, deadline ASC`;
    return NextResponse.json({ ...project, tasks });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [project] = await sql`UPDATE projects SET name=${b.name},goal_id=${b.goal_id??null},description=${b.description??''},status=${b.status},estimated_hours=${b.estimated_hours??0},actual_hours=${b.actual_hours??0},deadline=${b.deadline??''},updated_at=NOW() WHERE id=${id} AND user_id=${auth.userId} RETURNING *`;
    return NextResponse.json(project);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM projects WHERE id=${id} AND user_id=${auth.userId}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
