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

  return data as LogEntry[];
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

// deleteLog — called ONLY from the 30-second undo window in HomeScreen.
// No other code path should ever call this function.
// After 30 seconds, logs are permanent. No exceptions.
// This performs a direct table delete instead of soft-delete.
export const deleteLog = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting log:', error);
    throw error;
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

export const deleteUserAccount = async (userId: string): Promise<void> => {
  // Get the current session to get access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Error getting session:', sessionError);
    throw new Error('No active session');
  }

  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const proxySecret = process.env.EXPO_PUBLIC_PROXY_SECRET;

  if (!proxyUrl || !proxySecret) {
    throw new Error('Missing proxy configuration');
  }

  // Call server endpoint to delete user account using service role
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${proxyUrl}/api/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proxy-secret': proxySecret,
      },
      body: JSON.stringify({
        userId,
        accessToken: session.access_token,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error deleting account:', errorData);
      throw new Error(errorData.error || 'Failed to delete account');
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Timeout deleting account');
      throw new Error('Request timeout deleting account');
    }
    throw err;
  }

  // Sign out after successful deletion
  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error('Error signing out after account deletion:', signOutError);
    // Don't throw here since account is already deleted
  }
};

// Helper function to escape CSV values
const csvEscape = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '""';
  }
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const exportUserData = async (userId: string): Promise<string> => {
  const [logsResult, profileResult] = await Promise.all([
    supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (logsResult.error) throw logsResult.error;
  if (profileResult.error) throw profileResult.error;

  const logs = logsResult.data ?? [];
  const profile = profileResult.data;

  // Build CSV
  const profileSection = [
    '# PROFILE',
    'name,occupation,goal,success_definition,created_at',
    [
      csvEscape(profile?.name),
      csvEscape(profile?.occupation),
      csvEscape(profile?.goal),
      csvEscape(profile?.success_definition),
      csvEscape(profile?.created_at),
    ].join(','),
    '',
    '# LOGS',
    'id,timestamp,type,category,context,note,duration_mins',
    ...logs.map(log =>
      [
        csvEscape(log.id),
        csvEscape(log.timestamp),
        csvEscape(log.type),
        csvEscape(log.category),
        csvEscape(log.context),
        csvEscape(log.note),
        csvEscape(log.duration_mins),
      ].join(',')
    ),
  ].join('\n');

  return profileSection;
};
