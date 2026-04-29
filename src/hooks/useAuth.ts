import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEV_BYPASS_AUTH, DEV_USER } from '../lib/devConfig';

export interface UseAuthReturn {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      // DEV ONLY — remove before production build
      if (DEV_BYPASS_AUTH) {
        if (mounted) {
          setSession({ user: DEV_USER } as any);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        }
        if (mounted) {
          setSession(session);
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  return {
    session,
    userId: session?.user?.id || null,
    isLoading,
    signOut,
  };
};
