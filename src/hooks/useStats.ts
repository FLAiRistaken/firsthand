import { useMemo } from 'react';
import { LogEntry } from '../lib/types';

export interface UseStatsReturn {
  todayLogs: LogEntry[];
  todayWins: number;
  todaySins: number;
  streak: number;
  weekRatio: number | null;
  personalAvg: number | null;
  ratioDiff: number | null;
  aboveAverage: boolean;
  streakDots: boolean[];
}

// Utility to get start of day timestamp for comparison
const getStartOfDay = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Utility to step N calendar days from a reference date and return start-of-day ms.
// Uses Date#setDate so it is safe across DST transitions.
const getStartOfDayOffset = (reference: Date, dayOffset: number): number => {
  const d = new Date(reference);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const useStats = (logs: LogEntry[]): UseStatsReturn => {
  return useMemo(() => {
    const now = new Date();
    const startOfToday = getStartOfDay(now);
    const startOfTomorrow = getStartOfDayOffset(now, 1);

    // 1. Today's stats — strictly between start-of-today and start-of-tomorrow
    const todayLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= startOfToday && logTime < startOfTomorrow;
    });

    const todayWins = todayLogs.filter(log => log.type === 'win').length;
    const todaySins = todayLogs.filter(log => log.type === 'sin').length;

    // 2. Streak logic
    // A streak day = any day with at least one win log
    // Count consecutive days backwards from today
    // If today OR yesterday has a win, streak is alive
    // If neither today nor yesterday has a win, streak = 0
    let streak = 0;

    // Group logs by day (start of day timestamp)
    const winsByDay = new Set<number>();
    logs.forEach(log => {
      if (log.type === 'win') {
        winsByDay.add(getStartOfDay(new Date(log.timestamp)));
      }
    });

    const startOfYesterday = getStartOfDayOffset(now, -1);

    // Check if streak is alive
    if (winsByDay.has(startOfToday) || winsByDay.has(startOfYesterday)) {
      // Calculate streak length starting from today and going backwards
      let checkDate = new Date(now);
      checkDate.setHours(0, 0, 0, 0);

      // If today doesn't have a win, but yesterday does, start counting from yesterday
      if (!winsByDay.has(startOfToday)) {
        checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - 1);
        checkDate.setHours(0, 0, 0, 0);
      }

      while (winsByDay.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 3. Week Ratio
    // Filter logs to last 7 days (including today) — step 6 calendar days back
    const sevenDaysAgoMs = getStartOfDayOffset(now, -6);
    const weekLogs = logs.filter(log => {
      return new Date(log.timestamp).getTime() >= sevenDaysAgoMs;
    });

    let weekRatio: number | null = null;
    if (weekLogs.length > 0) {
      const weekWins = weekLogs.filter(log => log.type === 'win').length;
      weekRatio = Math.round((weekWins / weekLogs.length) * 100);
    }

    // 4. Personal Average
    let personalAvg: number | null = null;
    if (logs.length > 0) {
      const totalWins = logs.filter(log => log.type === 'win').length;
      personalAvg = Math.round((totalWins / logs.length) * 100);
    }

    // 5. Above Average
    const ratioDiff = weekRatio !== null && personalAvg !== null
      ? weekRatio - personalAvg
      : null;
    const aboveAverage = ratioDiff !== null && ratioDiff > 0;

    // 6. Streak Dots
    // Array of 7 booleans representing Mon-Sun of the current week
    // true if that calendar day has at least one win log
    const streakDots: boolean[] = Array(7).fill(false);

    // Get Monday of current week
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = now.getDay();
    // Convert so Monday is 0, Sunday is 6
    const jsDayToMonSun = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Find the start-of-day for Monday of this week using setDate (DST-safe)
    const mondayDate = new Date(now);
    mondayDate.setDate(mondayDate.getDate() - jsDayToMonSun);
    mondayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(mondayDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dayMs = dayDate.getTime();
      // Don't mark future days
      if (dayMs <= startOfToday) {
        streakDots[i] = winsByDay.has(dayMs);
      }
    }

    return {
      todayLogs,
      todayWins,
      todaySins,
      streak,
      weekRatio,
      personalAvg,
      ratioDiff,
      aboveAverage,
      streakDots,
    };
  }, [logs]);
};
