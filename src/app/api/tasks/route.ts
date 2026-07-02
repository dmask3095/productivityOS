export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const project_id = searchParams.get('project_id');
    const goal_id = searchParams.get('goal_id');

    let tasks;
    if (status && project_id) {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.status=${status} AND t.project_id=${project_id} ORDER BY t.priority ASC, t.deadline ASC`;
    } else if (status && goal_id) {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.status=${status} AND t.goal_id=${goal_id} ORDER BY t.priority ASC, t.deadline ASC`;
    } else if (status) {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.status=${status} ORDER BY t.priority ASC, t.deadline ASC`;
    } else if (project_id) {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.project_id=${project_id} ORDER BY t.priority ASC, t.deadline ASC`;
    } else if (goal_id) {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.goal_id=${goal_id} ORDER BY t.priority ASC, t.deadline ASC`;
    } else {
      tasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} ORDER BY t.priority ASC, t.deadline ASC`;
    }
    return NextResponse.json(tasks);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const b = await req.json();
    const [task] = await sql`
      INSERT INTO tasks (user_id,title,goal_id,project_id,priority,energy,estimated_minutes,actual_minutes,status,deadline,success_criteria,notes)
      VALUES (${auth.userId},${b.title},${b.goal_id??null},${b.project_id??null},${b.priority??'P2'},${b.energy??'medium'},${b.estimated_minutes??0},${b.actual_minutes??0},${b.status??'todo'},${b.deadline??''},${b.success_criteria??''},${b.notes??''})
      RETURNING *`;
    return NextResponse.json(task, { status: 201 });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
