export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const rows = await sql`SELECT m.* FROM milestones m JOIN goals g ON m.goal_id=g.id WHERE m.goal_id=${id} AND g.user_id=${auth.userId} ORDER BY sort_order ASC, m.id ASC`;
    return NextResponse.json(rows);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [goal] = await sql`SELECT id FROM goals WHERE id=${id} AND user_id=${auth.userId}`;
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const [ms] = await sql`INSERT INTO milestones (goal_id,title,deadline,sort_order) VALUES (${id},${b.title},${b.deadline??''},${b.sort_order??0}) RETURNING *`;
    return NextResponse.json(ms, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
