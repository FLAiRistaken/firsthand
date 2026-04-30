import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry } from '../lib/types';
import { getLogs, insertLog, updateLog, setLogCancelled as dbSetLogCancelled } from '../lib/db';

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

// Monotonic counter used as part of the temp-ID fallback so that two logs
// created in the same millisecond still get distinct IDs.
let _tempIdCounter = 0;
const generateTempId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return `temp-${globalThis.crypto.randomUUID()}`;
  }
  _tempIdCounter += 1;
  return `temp-${Date.now()}-${_tempIdCounter}`;
};

export interface UseLogsReturn {
  logs: LogEntry[];
  isLoading: boolean;
  error: string | null;
  addLog: (entry: Omit<LogEntry, 'id' | 'created_at' | 'user_id' | 'timestamp'> & { timestamp?: string }) => Promise<LogEntry>;
  editLog: (id: string, updates: Partial<Pick<LogEntry, 'note' | 'category' | 'context' | 'duration_mins'>>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useLogs = (userId: string | null): UseLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pendingDeleteTimestamps = useRef<Set<string>>(new Set());

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

      const filteredQueue = queue.filter(
        (entry: Omit<LogEntry, 'id' | 'created_at'>) =>
          !pendingDeleteTimestamps.current.has(entry.timestamp)
      );

      if (filteredQueue.length !== queue.length) {
        if (filteredQueue.length === 0) {
          await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
        } else {
          await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
        }
      }

      if (filteredQueue.length === 0) return;

      console.log(`Flushing ${filteredQueue.length} offline logs to Supabase`);

      const newQueue = [...filteredQueue];
      const successfullyInserted: LogEntry[] = [];

      for (let i = 0; i < filteredQueue.length; i++) {
        const item = filteredQueue[i];
        // Ensure user_id is set correctly for the current user
        const itemToInsert = { ...item, user_id: userId };

        try {
          const insertedLog = await insertLog(itemToInsert);
          successfullyInserted.push(insertedLog);
          newQueue.shift(); // Remove the item we just successfully inserted
        } catch (err) {
          if (isNetworkError(err)) {
            console.error('Failed to flush log (network error), keeping in queue:', err);
            break; // Stop trying if we hit a network error (likely still offline)
          } else {
            console.error('Terminal server error flushing log, discarding item:', err);
            newQueue.shift(); // Remove poisoned item to avoid blocking queue
            // continue loop
          }
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

  const addLog = async (entry: Omit<LogEntry, 'id' | 'created_at' | 'user_id' | 'timestamp'> & { timestamp?: string }): Promise<LogEntry> => {
    if (!userId) throw new Error('User not authenticated');

    // Create a temporary ID and timestamp for optimistic update
    const tempId = generateTempId();
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
    setLogs((prev: LogEntry[]) => [optimisticLog, ...prev].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));

    const insertPayload: Omit<LogEntry, 'id' | 'created_at'> = {
      ...entry,
      user_id: userId,
      timestamp: entry.timestamp || now,
    };

    try {
      const insertedLog = await insertLog(insertPayload);
      // Replace optimistic entry with server-confirmed entry
      setLogs((prev: LogEntry[]) => prev.map(l =>
        l.id === tempId ? insertedLog : l
      ).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      return insertedLog;
    } catch (err) {
      if (isNetworkError(err)) {
        // Network/offline failure — keep the optimistic item and queue for retry
        console.warn('Network error, queueing log for offline sync', err);
        try {
          const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
          let queue: Omit<LogEntry, 'id' | 'created_at'>[] = [];
          if (queueData) {
            try {
              const parsed: unknown = JSON.parse(queueData);
              queue = Array.isArray(parsed) ? (parsed as Omit<LogEntry, 'id' | 'created_at'>[]) : [];
            } catch {
              queue = [];
            }
          }
          queue.push(insertPayload);
          await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        } catch (storageErr) {
          console.error('Failed to save to offline queue:', storageErr);
        }
        return optimisticLog;
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
    setLogs((prev: LogEntry[]) => prev.map(log =>
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

  const deleteLog = async (id: string): Promise<void> => {
    if (!userId) return;

    const logToDelete = logs.find(l => l.id === id);

    // Optimistic update — remove from local state immediately
    setLogs((prev: LogEntry[]) => prev.filter(l => l.id !== id));

    if (logToDelete?.timestamp) {
      pendingDeleteTimestamps.current.add(logToDelete.timestamp);
    }

    if (logToDelete) {
      try {
        const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (queueData) {
          const queue: Omit<LogEntry, 'created_at'>[] = JSON.parse(queueData);
          const newQueue = queue.filter((q) => q.id !== id && q.timestamp !== logToDelete?.timestamp);
          if (newQueue.length !== queue.length) {
            if (newQueue.length === 0) {
              await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
            } else {
              await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
            }
          }
        }
      } catch (storageErr) {
        console.error('Failed to remove from offline queue on delete:', storageErr);
      }
    }

    try {
      await dbSetLogCancelled(id, userId);
    } catch (err: unknown) {
      // Revert — re-fetch to restore correct state
      fetchLogs();
      if (err instanceof Error && err.message.includes('Undo window expired')) {
        const expiredError = new Error('Too late to undo');
        (expiredError as any).code = 'EXPIRED';
        throw expiredError;
      }
      throw new Error('Failed to cancel log');
    }
  };

  return {
    logs,
    isLoading,
    error,
    addLog,
    editLog,
    deleteLog,
    refresh: fetchLogs,
  };
};
