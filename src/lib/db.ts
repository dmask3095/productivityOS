import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL || 'postgresql://build-placeholder/db');

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      specific_goal TEXT NOT NULL DEFAULT '',
      why TEXT DEFAULT '',
      success_criteria TEXT NOT NULL DEFAULT '',
      start_date TEXT DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'P2',
      dependencies TEXT DEFAULT '',
      estimated_hours NUMERIC DEFAULT 0,
      actual_hours NUMERIC DEFAULT 0,
      completion_pct INTEGER DEFAULT 0,
      next_action TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id BIGSERIAL PRIMARY KEY,
      goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      deadline TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      estimated_hours NUMERIC DEFAULT 0,
      actual_hours NUMERIC DEFAULT 0,
      deadline TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
      project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
      priority TEXT DEFAULT 'P2',
      energy TEXT DEFAULT 'medium',
      estimated_minutes INTEGER DEFAULT 0,
      actual_minutes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'todo',
      deadline TEXT DEFAULT '',
      success_criteria TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS daily_plans (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_date TEXT NOT NULL,
      top_priority_1 TEXT DEFAULT '',
      top_priority_2 TEXT DEFAULT '',
      top_priority_3 TEXT DEFAULT '',
      meetings TEXT DEFAULT '',
      quick_tasks TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, plan_date)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS deep_work_blocks (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_date TEXT NOT NULL,
      time_label TEXT DEFAULT '',
      task_description TEXT DEFAULT '',
      task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
      completed INTEGER DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      task_description TEXT NOT NULL DEFAULT '',
      goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
      project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
      time_spent_minutes INTEGER DEFAULT 0,
      difficulty INTEGER DEFAULT 3,
      lessons TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS time_entries (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_date TEXT NOT NULL,
      category TEXT NOT NULL,
      hours NUMERIC DEFAULT 0,
      notes TEXT DEFAULT '',
      UNIQUE(user_id, entry_date, category)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS habits (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target TEXT DEFAULT 'daily',
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id BIGSERIAL PRIMARY KEY,
      habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      UNIQUE(habit_id, log_date)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      wins TEXT DEFAULT '',
      mistakes TEXT DEFAULT '',
      lessons TEXT DEFAULT '',
      hours_worked NUMERIC DEFAULT 0,
      goals_completed INTEGER DEFAULT 0,
      goals_delayed INTEGER DEFAULT 0,
      focus_score INTEGER DEFAULT 0,
      productivity_score INTEGER DEFAULT 0,
      next_week_priorities TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, week_start)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_reviews (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      major_achievements TEXT DEFAULT '',
      goals_completed INTEGER DEFAULT 0,
      goals_failed INTEGER DEFAULT 0,
      projects_finished INTEGER DEFAULT 0,
      total_hours NUMERIC DEFAULT 0,
      biggest_distraction TEXT DEFAULT '',
      improvement_plan TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, month)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS brain_dump (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      converted_task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
