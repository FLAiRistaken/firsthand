export type LogType = 'win' | 'sin';
export type LogContext = 'work' | 'personal';

export interface LogEntry {
  id: string;
  user_id: string;
  timestamp: string;
  type: LogType;
  category: string;
  note?: string;
  context?: LogContext;
  duration_mins?: number;
  created_at: string;
  cancelled?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  occupation: string;
  ai_tools_used: string[];
  primary_uses: string[];
  goal: string;
  success_definition: string;
  custom_categories: string[];
  created_at: string;
  onboarded: boolean;
  default_context?: LogContext | null;
}

export interface AppState {
  profile: UserProfile | null;
  logs: LogEntry[];
  isLoading: boolean;
}
