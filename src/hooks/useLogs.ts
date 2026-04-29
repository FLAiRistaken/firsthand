import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry } from '../lib/types';
import { getLogs, insertLog, updateLog } from '../lib/db';

const OFFLINE_QUEUE_KEY = 'firsthand_offline_queue';

// Returns true only for errors that are likely caused by lack of network
// connectivity. Server-side errors (4xx/5xx) have a numeric `status` and
// should NOT be queued because they will never succeed on retry.
const isNetworkError = (err: unknown): boolean => {
  if (err instanceof TypeError) return true;
  if (err !== null && typeof err === 'object' && 'status' in err) {
    return (err as { status: number }).status === 0;
  }
  return false;
};

export interface UseLogsReturn {
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
  addLog: (entry: Omit<LogEntry, 'id' | 'created_at' | 'user_id' | 'timestamp'> & { timestamp?: string }) => Promise<void>;
  editLog: (id: string, updates: Partial<Pick<LogEntry, 'note' | 'category' | 'context' | 'duration_mins'>>) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useLogs = (userId: string | null): UseLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getLogs(userId);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const flushOfflineQueue = useCallback(async () => {
    if (!userId) return;

    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!queueData) return;

      const queue: Omit<LogEntry, 'id' | 'created_at'>[] = JSON.parse(queueData);
      if (queue.length === 0) return;

      console.log(`Flushing ${queue.length} offline logs to Supabase`);

      const newQueue = [...queue];
      const successfullyInserted: LogEntry[] = [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        // Ensure user_id is set correctly for the current user
        const itemToInsert = { ...item, user_id: userId };

        try {
          const insertedLog = await insertLog(itemToInsert);
          successfullyInserted.push(insertedLog);
          newQueue.shift(); // Remove the item we just successfully inserted
        } catch (err) {
          console.error('Failed to flush log, keeping in queue:', err);
          break; // Stop trying if we hit an error (likely still offline)
        }
      }

      if (newQueue.length === 0) {
        await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      } else {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
      }

      if (successfullyInserted.length > 0) {
        await fetchLogs(); // Refresh to get the actual server IDs and dates
      }
    } catch (err) {
      console.error('Error processing offline queue:', err);
    }
  }, [userId, fetchLogs]);

  useEffect(() => {
    fetchLogs();
    flushOfflineQueue();

    // Flush the offline queue whenever the app returns to the foreground
    // (covers the case where the user was offline, then reconnects without
    //  unmounting this hook).
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        flushOfflineQueue();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId, fetchLogs, flushOfflineQueue]);

  const addLog = async (entry: Omit<LogEntry, 'id' | 'created_at' | 'user_id' | 'timestamp'> & { timestamp?: string }) => {
    if (!userId) throw new Error('User not authenticated');

    // Create a temporary ID and timestamp for optimistic update
    const tempId = `temp-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
    const now = new Date().toISOString();

    const optimisticLog: LogEntry = {
      ...entry,
      id: tempId,
      user_id: userId,
      created_at: now,
      // If the caller didn't provide a timestamp, use current time
      timestamp: entry.timestamp || now,
    };

    // Optimistically update UI
    setLogs(prev => [optimisticLog, ...prev].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));

    const insertPayload: Omit<LogEntry, 'id' | 'created_at'> = {
      ...entry,
      user_id: userId,
      timestamp: entry.timestamp || now,
    };

    try {
      await insertLog(insertPayload);
      // Wait for insert then refresh to get real ID
      await fetchLogs();
    } catch (err) {
      if (isNetworkError(err)) {
        // Network/offline failure — keep the optimistic item and queue for retry
        console.warn('Network error, queueing log for offline sync', err);
        try {
          const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
          const queue = queueData ? JSON.parse(queueData) : [];
          queue.push(insertPayload);
          await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        } catch (storageErr) {
          console.error('Failed to save to offline queue:', storageErr);
        }
      } else {
        // Server-side error (validation, permissions, etc.) — revert optimistic update
        console.error('Server rejected log insert, reverting optimistic update', err);
        await fetchLogs();
        throw err;
      }
    }
  };

  const editLog = async (id: string, updates: Partial<Pick<LogEntry, 'note' | 'category' | 'context' | 'duration_mins'>>) => {
    if (!userId) throw new Error('User not authenticated');

    // Optimistically update
    setLogs(prev => prev.map(log =>
      log.id === id ? { ...log, ...updates } : log
    ));

    try {
      await updateLog(id, userId, updates);
      // Server state is now synced
    } catch (err) {
      console.error('Failed to update log:', err);
      // Revert optimistic update on failure by refetching
      await fetchLogs();
      throw err;
    }
  };

  return {
    logs,
    isLoading,
    error,
    addLog,
    editLog,
    refresh: fetchLogs,
  };
};
