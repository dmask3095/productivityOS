export type Priority = 'P1' | 'P2' | 'P3';
export type Energy = 'high' | 'medium' | 'low';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'archived';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'backlog' | 'someday' | 'archived';
export type BrainDumpType = 'idea' | 'research' | 'business' | 'future_task';

export interface Goal {
  id: number;
  title: string;
  specific_goal: string;
  why: string;
  success_criteria: string;
  start_date: string;
  deadline: string;
  status: GoalStatus;
  priority: Priority;
  dependencies: string;
  estimated_hours: number;
  actual_hours: number;
  completion_pct: number;
  next_action: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  deadline: string;
  completed: number;
  sort_order: number;
}

export interface Project {
  id: number;
  name: string;
  goal_id: number | null;
  description: string;
  status: ProjectStatus;
  estimated_hours: number;
  actual_hours: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  goal_id: number | null;
  project_id: number | null;
  priority: Priority;
  energy: Energy;
  estimated_minutes: number;
  actual_minutes: number;
  status: TaskStatus;
  deadline: string;
  success_criteria: string;
  notes: string;
  created_at: string;
  completed_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: number;
  plan_date: string;
  top_priority_1: string;
  top_priority_2: string;
  top_priority_3: string;
  meetings: string;
  quick_tasks: string;
  notes: string;
  created_at: string;
}

export interface DeepWorkBlock {
  id: number;
  plan_date: string;
  time_label: string;
  task_description: string;
  task_id: number | null;
  completed: number;
}

export interface DailyLog {
  id: number;
  log_date: string;
  task_description: string;
  goal_id: number | null;
  project_id: number | null;
  time_spent_minutes: number;
  difficulty: number;
  lessons: string;
  created_at: string;
}

export interface TimeEntry {
  id: number;
  entry_date: string;
  category: string;
  hours: number;
  notes: string;
}

export interface Habit {
  id: number;
  name: string;
  target: string;
  current_streak: number;
  longest_streak: number;
  status: string;
  created_at: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  log_date: string;
  completed: number;
}

export interface WeeklyReview {
  id: number;
  week_start: string;
  wins: string;
  mistakes: string;
  lessons: string;
  hours_worked: number;
  goals_completed: number;
  goals_delayed: number;
  focus_score: number;
  productivity_score: number;
  next_week_priorities: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReview {
  id: number;
  month: string;
  major_achievements: string;
  goals_completed: number;
  goals_failed: number;
  projects_finished: number;
  total_hours: number;
  biggest_distraction: string;
  improvement_plan: string;
  created_at: string;
  updated_at: string;
}

export interface BrainDump {
  id: number;
  type: BrainDumpType;
  content: string;
  converted_task_id: number | null;
  created_at: string;
}

export interface DashboardStats {
  activeGoals: number;
  activeProjects: number;
  todayTasks: Task[];
  weeklyCompletionPct: number;
  monthlyCompletionPct: number;
  avgDailyDeepWork: number;
  totalProductiveHours: number;
  upcomingDeadlines: (Goal | Task | Project)[];
  overdueTasks: Task[];
}
