export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
  try {
    const today = new Date().toISOString().split('T')[0];
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    const weekStart = d.toISOString().split('T')[0];
    const monthStart = today.slice(0, 7);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const [{ cnt: activeGoals }] = await sql`SELECT COUNT(*) as cnt FROM goals WHERE user_id=${auth.userId} AND status='active'`;
    const [{ cnt: activeProjects }] = await sql`SELECT COUNT(*) as cnt FROM projects WHERE user_id=${auth.userId} AND status='active'`;
    const todayTasks = await sql`SELECT t.*,g.title as goal_title,p.name as project_name FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id LEFT JOIN projects p ON t.project_id=p.id WHERE t.user_id=${auth.userId} AND t.status IN ('todo','in_progress') AND (t.deadline=${today} OR t.deadline='') ORDER BY t.priority ASC LIMIT 20`;
    const [{ cnt: weeklyTotal }] = await sql`SELECT COUNT(*) as cnt FROM tasks WHERE user_id=${auth.userId} AND deadline>=${weekStart} AND status NOT IN ('archived','backlog','someday')`;
    const [{ cnt: weeklyDone }] = await sql`SELECT COUNT(*) as cnt FROM tasks WHERE user_id=${auth.userId} AND status='done' AND completed_at>=${weekStart}`;
    const weeklyCompletionPct = Number(weeklyTotal) > 0 ? Math.round((Number(weeklyDone) / Number(weeklyTotal)) * 100) : 0;
    const [{ cnt: monthlyTotal }] = await sql`SELECT COUNT(*) as cnt FROM tasks WHERE user_id=${auth.userId} AND TO_CHAR(deadline::date,'YYYY-MM')=${monthStart} AND status NOT IN ('archived','backlog','someday')`;
    const [{ cnt: monthlyDone }] = await sql`SELECT COUNT(*) as cnt FROM tasks WHERE user_id=${auth.userId} AND status='done' AND TO_CHAR(completed_at::date,'YYYY-MM')=${monthStart}`;
    const monthlyCompletionPct = Number(monthlyTotal) > 0 ? Math.round((Number(monthlyDone) / Number(monthlyTotal)) * 100) : 0;
    const [deepWorkRow] = await sql`SELECT ROUND(AVG(day_total)::numeric,2) as avg FROM (SELECT entry_date, SUM(hours) as day_total FROM time_entries WHERE user_id=${auth.userId} AND category='Deep Work' AND entry_date::date >= NOW()-INTERVAL '30 days' GROUP BY entry_date) sub`;
    const [{ total: productiveHours }] = await sql`SELECT ROUND(SUM(hours)::numeric,2) as total FROM time_entries WHERE user_id=${auth.userId} AND TO_CHAR(entry_date::date,'YYYY-MM')=${monthStart} AND category NOT IN ('Sleep','Entertainment')`;
    const upcomingGoals = await sql`SELECT id,title,deadline,'goal' as type,priority FROM goals WHERE user_id=${auth.userId} AND status='active' AND deadline>=${today} AND deadline<=${nextWeekStr} ORDER BY deadline ASC`;
    const upcomingTasks = await sql`SELECT id,title,deadline,'task' as type,priority FROM tasks WHERE user_id=${auth.userId} AND status IN ('todo','in_progress') AND deadline>=${today} AND deadline<=${nextWeekStr} ORDER BY deadline ASC`;
    const upcomingDeadlines = [...upcomingGoals, ...upcomingTasks].sort((a, b) => String(a.deadline) > String(b.deadline) ? 1 : -1);
    const overdueTasks = await sql`SELECT t.*,g.title as goal_title FROM tasks t LEFT JOIN goals g ON t.goal_id=g.id WHERE t.user_id=${auth.userId} AND t.status IN ('todo','in_progress') AND t.deadline<${today} AND t.deadline!='' ORDER BY t.deadline ASC`;

    return NextResponse.json({ activeGoals: Number(activeGoals), activeProjects: Number(activeProjects), todayTasks, weeklyCompletionPct, monthlyCompletionPct, avgDailyDeepWork: deepWorkRow?.avg??0, totalProductiveHours: productiveHours??0, upcomingDeadlines, overdueTasks });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
