export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const habits = await sql`SELECT * FROM habits WHERE user_id=${auth.userId} ORDER BY status ASC, name ASC`;
    return NextResponse.json(habits);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [habit] = await sql`INSERT INTO habits (user_id,name,target,status) VALUES (${auth.userId},${b.name},${b.target??'daily'},${b.status??'active'}) RETURNING *`;
    return NextResponse.json(habit, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
