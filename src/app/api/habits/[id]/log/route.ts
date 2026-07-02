export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { recalcHabitStreak } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const logs = month
      ? await sql`SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id=h.id WHERE hl.habit_id=${id} AND h.user_id=${auth.userId} AND TO_CHAR(hl.log_date::date,'YYYY-MM')=${month} ORDER BY hl.log_date ASC`
      : await sql`SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id=h.id WHERE hl.habit_id=${id} AND h.user_id=${auth.userId} ORDER BY hl.log_date DESC LIMIT 60`;
    return NextResponse.json(logs);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const b = await req.json();
    const [habit] = await sql`SELECT id FROM habits WHERE id=${id} AND user_id=${auth.userId}`;
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await sql`INSERT INTO habit_logs (habit_id,log_date,completed) VALUES (${id},${b.log_date},${b.completed?1:0}) ON CONFLICT (habit_id,log_date) DO UPDATE SET completed=${b.completed?1:0}`;
    const allLogs = await sql`SELECT log_date, completed FROM habit_logs WHERE habit_id=${id} ORDER BY log_date ASC`;
    const { current_streak, longest_streak } = recalcHabitStreak(allLogs as { log_date: string; completed: number }[]);
    const [updated] = await sql`UPDATE habits SET current_streak=${current_streak},longest_streak=${longest_streak} WHERE id=${id} RETURNING *`;
    return NextResponse.json(updated);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
