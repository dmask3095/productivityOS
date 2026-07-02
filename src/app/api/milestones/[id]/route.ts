export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [ms] = await sql`UPDATE milestones SET title=${b.title},deadline=${b.deadline??''},completed=${b.completed??0},sort_order=${b.sort_order??0} WHERE id=${id} RETURNING *`;
    return NextResponse.json(ms);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM milestones WHERE id=${id}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
