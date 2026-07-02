export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const items = type
      ? await sql`SELECT * FROM brain_dump WHERE user_id=${auth.userId} AND type=${type} ORDER BY id DESC`
      : await sql`SELECT * FROM brain_dump WHERE user_id=${auth.userId} ORDER BY type ASC, id DESC`;
    return NextResponse.json(items);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [item] = await sql`INSERT INTO brain_dump (user_id,type,content) VALUES (${auth.userId},${b.type},${b.content}) RETURNING *`;
    return NextResponse.json(item, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
