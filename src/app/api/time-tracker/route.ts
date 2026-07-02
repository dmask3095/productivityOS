import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const aggregate = searchParams.get('aggregate');

    if (aggregate === 'category') {
      const rows = month
        ? await sql`SELECT category, ROUND(SUM(hours)::numeric,2) as total_hours FROM time_entries WHERE user_id=${auth.userId} AND TO_CHAR(entry_date::date,'YYYY-MM')=${month} GROUP BY category`
        : await sql`SELECT category, ROUND(SUM(hours)::numeric,2) as total_hours FROM time_entries WHERE user_id=${auth.userId} GROUP BY category`;
      return NextResponse.json(rows);
    }
    if (date) {
      const entries = await sql`SELECT * FROM time_entries WHERE user_id=${auth.userId} AND entry_date=${date} ORDER BY category ASC`;
      return NextResponse.json(entries);
    }
    if (month) {
      const entries = await sql`SELECT * FROM time_entries WHERE user_id=${auth.userId} AND TO_CHAR(entry_date::date,'YYYY-MM')=${month} ORDER BY entry_date DESC`;
      return NextResponse.json(entries);
    }
    const entries = await sql`SELECT * FROM time_entries WHERE user_id=${auth.userId} ORDER BY entry_date DESC LIMIT 100`;
    return NextResponse.json(entries);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [entry] = await sql`
      INSERT INTO time_entries (user_id,entry_date,category,hours,notes) VALUES (${auth.userId},${b.entry_date},${b.category},${b.hours??0},${b.notes??''})
      ON CONFLICT (user_id,entry_date,category) DO UPDATE SET hours=${b.hours??0},notes=${b.notes??''}
      RETURNING *`;
    return NextResponse.json(entry, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
