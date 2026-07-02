export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  const { date } = await params;
  try {
    const b = await req.json();
    const [block] = await sql`INSERT INTO deep_work_blocks (user_id,plan_date,time_label,task_description,task_id) VALUES (${auth.userId},${date},${b.time_label??''},${b.task_description??''},${b.task_id??null}) RETURNING *`;
    return NextResponse.json(block, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
