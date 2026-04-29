import { useMemo } from 'react';
import { LogEntry } from '../lib/types';

export interface UseStatsReturn {
  todayLogs: LogEntry[];
  todayWins: number;
  todaySins: number;
  streak: number;
  weekRatio: number | null;
  personalAvg: number | null;
  aboveAverage: boolean;
  streakDots: boolean[];
}

// Utility to get start of day timestamp for comparison
const getStartOfDay = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const useStats = (logs: LogEntry[]): UseStatsReturn => {
  return useMemo(() => {
    const now = new Date();
    const startOfToday = getStartOfDay(now);

    // 1. Today's stats
    const todayLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      // Assume logs are only ever in the past/present, so if it's >= startOfToday, it's today
      return logTime >= startOfToday;
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

    const msInDay = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - msInDay;

    // Check if streak is alive
    if (winsByDay.has(startOfToday) || winsByDay.has(startOfYesterday)) {
      // Calculate streak length starting from today and going backwards
      let checkDateMs = startOfToday;

      // If today doesn't have a win, but yesterday does, start counting from yesterday
      if (!winsByDay.has(startOfToday)) {
        checkDateMs = startOfYesterday;
      }

      while (winsByDay.has(checkDateMs)) {
        streak++;
        checkDateMs -= msInDay;
      }
    }

    // 3. Week Ratio
    // Filter logs to last 7 days (including today)
    const sevenDaysAgoMs = startOfToday - (6 * msInDay);
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
    const aboveAverage = weekRatio !== null && personalAvg !== null && weekRatio > personalAvg;

    // 6. Streak Dots
    // Array of 7 booleans representing Mon-Sun of the current week
    // true if that calendar day has at least one win log
    const streakDots: boolean[] = Array(7).fill(false);

    // Get Monday of current week
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = now.getDay();
    // Convert so Monday is 0, Sunday is 6
    const jsDayToMonSun = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Find timestamp of Monday of this week
    const mondayMs = startOfToday - (jsDayToMonSun * msInDay);

    for (let i = 0; i < 7; i++) {
      const dayMs = mondayMs + (i * msInDay);
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
      aboveAverage,
      streakDots,
    };
  }, [logs]);
};
