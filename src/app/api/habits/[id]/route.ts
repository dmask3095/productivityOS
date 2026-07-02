import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [habit] = await sql`UPDATE habits SET name=${b.name},target=${b.target??'daily'},status=${b.status??'active'},current_streak=${b.current_streak??0},longest_streak=${b.longest_streak??0} WHERE id=${id} AND user_id=${auth.userId} RETURNING *`;
    return NextResponse.json(habit);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await sql`DELETE FROM habits WHERE id=${id} AND user_id=${auth.userId}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
