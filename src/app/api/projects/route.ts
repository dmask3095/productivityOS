export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projects = status
      ? await sql`SELECT p.*,g.title as goal_title FROM projects p LEFT JOIN goals g ON p.goal_id=g.id WHERE p.user_id=${auth.userId} AND p.status=${status} ORDER BY p.deadline ASC`
      : await sql`SELECT p.*,g.title as goal_title FROM projects p LEFT JOIN goals g ON p.goal_id=g.id WHERE p.user_id=${auth.userId} ORDER BY p.status ASC, p.deadline ASC`;
    return NextResponse.json(projects);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [project] = await sql`
      INSERT INTO projects (user_id,name,goal_id,description,status,estimated_hours,actual_hours,deadline)
      VALUES (${auth.userId},${b.name},${b.goal_id??null},${b.description??''},${b.status??'active'},${b.estimated_hours??0},${b.actual_hours??0},${b.deadline??''})
      RETURNING *`;
    return NextResponse.json(project, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
