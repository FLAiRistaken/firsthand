import { supabase } from './supabase';
import { LogEntry, UserProfile } from './types';

export const getLogs = async (userId: string): Promise<LogEntry[]> => {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }

  // Filter out cancelled logs (soft-deleted records)
  return (data as LogEntry[]).filter(log => !log.cancelled);
};

export const insertLog = async (log: Omit<LogEntry, 'id' | 'created_at'>): Promise<LogEntry> => {
  const { data, error } = await supabase
    .from('logs')
    .insert([log])
    .select()
    .single();

  if (error) {
    console.error('Error inserting log:', error);
    throw error;
  }

  return data as LogEntry;
};

export const updateLog = async (
  id: string,
  userId: string,
  updates: Partial<Pick<LogEntry, 'note' | 'category' | 'context' | 'duration_mins'>>
): Promise<LogEntry> => {
  const { data, error } = await supabase
    .from('logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating log:', error);
    throw error;
  }

  return data as LogEntry;
};

// setLogCancelled — called ONLY from the 30-second undo window in HomeScreen.
// No other code path should ever call this function.
// After 30 seconds, logs are permanent. No exceptions.
// This performs a non-destructive soft-delete by marking the log as cancelled.
export const setLogCancelled = async (id: string, userId: string): Promise<void> => {
  const cutoffIso = new Date(Date.now() - 30000).toISOString();

  const { data, error } = await supabase
    .from('logs')
    .update({ cancelled: true })
    .eq('id', id)
    .eq('user_id', userId)
    .gte('created_at', cutoffIso)
    .select();

  if (error) {
    console.error('Error cancelling log:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Undo window expired. Logs can only be cancelled within 30 seconds of creation.');
  }
};

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data as UserProfile | null;
};

export const upsertProfile = async (
  profile: Partial<UserProfile> & { id: string }
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([profile], { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }

  return data as UserProfile;
};
