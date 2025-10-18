// Utility functions for cron schedule calculations

export function calculateNextRun(cronExpression: string, fromDate: Date = new Date()): Date {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  const next = new Date(fromDate);
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  // Handle minute
  if (minute === '*') {
    next.setMinutes(next.getMinutes() + 1);
  } else if (minute.startsWith('*/')) {
    const interval = parseInt(minute.slice(2));
    const currentMinute = next.getMinutes();
    const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
    if (nextMinute >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    } else {
      next.setMinutes(nextMinute);
    }
  } else {
    const targetMinute = parseInt(minute);
    if (next.getMinutes() >= targetMinute) {
      next.setHours(next.getHours() + 1);
    }
    next.setMinutes(targetMinute);
  }
  
  // Handle hour
  if (hour !== '*' && !hour.startsWith('*/')) {
    const targetHour = parseInt(hour);
    if (next.getHours() > targetHour || (next.getHours() === targetHour && next.getMinutes() > parseInt(minute || '0'))) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(targetHour);
  } else if (hour.startsWith('*/')) {
    const interval = parseInt(hour.slice(2));
    const currentHour = next.getHours();
    const nextHour = Math.ceil((currentHour + 1) / interval) * interval;
    if (nextHour >= 24) {
      next.setDate(next.getDate() + 1);
      next.setHours(0);
    } else {
      next.setHours(nextHour);
      next.setMinutes(0);
    }
  }
  
  return next;
}

export function getScheduleDescription(cronExpression: string): string {
  const presets: Record<string, string> = {
    '* * * * *': 'Every minute',
    '*/5 * * * *': 'Every 5 minutes',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 * * * *': 'Every hour',
    '0 */6 * * *': 'Every 6 hours',
    '0 0 * * *': 'Daily at midnight',
    '0 2 * * *': 'Daily at 2 AM',
    '0 0 * * MON': 'Weekly (Monday)',
  };
  
  return presets[cronExpression] || cronExpression;
}
