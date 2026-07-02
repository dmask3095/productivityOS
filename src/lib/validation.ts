export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateSmartGoal(data: {
  title?: string;
  specific_goal?: string;
  success_criteria?: string;
  deadline?: string;
  priority?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  if (!data.specific_goal?.trim() || data.specific_goal.trim().length < 20) {
    errors.push({
      field: 'specific_goal',
      message: 'Specific goal must be at least 20 characters — be precise and measurable (SMART: Specific)',
    });
  }

  if (!data.success_criteria?.trim() || data.success_criteria.trim().length < 10) {
    errors.push({
      field: 'success_criteria',
      message: 'Success criteria required — describe exactly how you will measure success (SMART: Measurable)',
    });
  }

  if (!data.deadline?.trim()) {
    errors.push({ field: 'deadline', message: 'Deadline is required (SMART: Time-bound)' });
  } else {
    const deadline = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(deadline.getTime())) {
      errors.push({ field: 'deadline', message: 'Invalid deadline date' });
    } else if (deadline < today) {
      errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
    }
  }

  if (!data.priority) {
    errors.push({ field: 'priority', message: 'Priority (P1/P2/P3) is required' });
  }

  return { valid: errors.length === 0, errors };
}

export function validateTask(data: {
  title?: string;
  priority?: string;
  deadline?: string;
  estimated_minutes?: number | string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Task title is required' });
  }

  if (!data.priority) {
    errors.push({ field: 'priority', message: 'Priority (P1/P2/P3) is required' });
  }

  if (!data.deadline?.trim()) {
    errors.push({ field: 'deadline', message: 'Deadline is required' });
  }

  const mins = Number(data.estimated_minutes);
  if (!mins || mins <= 0) {
    errors.push({ field: 'estimated_minutes', message: 'Estimated time is required (must be > 0 minutes)' });
  }

  return { valid: errors.length === 0, errors };
}

export function checkDeadlineRealism(
  estimatedHours: number,
  deadline: string
): { realistic: boolean; warning: string; hoursPerDay: number } {
  if (!deadline || estimatedHours <= 0) {
    return { realistic: true, warning: '', hoursPerDay: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(1, Math.ceil((due.getTime() - today.getTime()) / msPerDay));
  const hoursPerDay = estimatedHours / daysRemaining;

  if (hoursPerDay > 8) {
    return {
      realistic: false,
      warning: `⚠️ Unrealistic: requires ${hoursPerDay.toFixed(1)}h/day over ${daysRemaining} days. Extend deadline or reduce scope.`,
      hoursPerDay,
    };
  }

  if (hoursPerDay > 5) {
    return {
      realistic: false,
      warning: `⚠️ Tight: requires ${hoursPerDay.toFixed(1)}h/day over ${daysRemaining} days. No buffer for delays.`,
      hoursPerDay,
    };
  }

  return { realistic: true, warning: '', hoursPerDay };
}

export function calcCompletionPct(total: number, done: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function recalcHabitStreak(logs: { log_date: string; completed: number }[]): {
  current_streak: number;
  longest_streak: number;
} {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.log_date)
    .sort();

  if (!completedDates.length) return { current_streak: 0, longest_streak: 0 };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];

  const dateSet = new Set(completedDates);

  // Current streak: count backwards from today
  let current = 0;
  let startDate = dateSet.has(todayStr) ? todayStr : dateSet.has(yesterdayStr) ? yesterdayStr : null;
  if (startDate) {
    let d = new Date(startDate);
    while (dateSet.has(d.toISOString().split('T')[0])) {
      current++;
      d = new Date(d.getTime() - 86400000);
    }
  }

  // Longest streak
  let longest = 1;
  let streak = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 1;
    }
  }

  return { current_streak: current, longest_streak: Math.max(longest, current) };
}

export function formatMinutes(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function isOverdue(deadline: string, status: string): boolean {
  if (!deadline || status === 'done' || status === 'archived') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deadline) < today;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
