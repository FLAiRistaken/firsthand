import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../lib/types';
import { getProfile, upsertProfile } from '../lib/db';

export interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  isCreatingAccount: boolean;
  setIsCreatingAccount: (value: boolean) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getProfile(userId);
      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to fetch profile:', err.message);
      } else {
        console.error('Failed to fetch profile:', String(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      // Optimistic update
      setProfile(prev => {
        if (!prev) {
          // We shouldn't really be updating if we don't have a profile
          // but if it's the first time creation, handle it gracefully
          return {
            id: userId,
            name: updates.name || '',
            occupation: updates.occupation || '',
            ai_tools_used: updates.ai_tools_used || [],
            primary_uses: updates.primary_uses || [],
            goal: updates.goal || '',
            success_definition: updates.success_definition || '',
            custom_categories: updates.custom_categories || [],
            onboarded: updates.onboarded || false,
            created_at: new Date().toISOString(),
            ...updates,
          } as UserProfile;
        }
        return { ...prev, ...updates };
      });
      await upsertProfile({ ...updates, id: userId });
      // Confirm from server — critical for RootNavigator to see onboarded: true
      await fetchProfile();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to update profile:', err.message);
      } else {
        console.error('Failed to update profile:', String(err));
      }
      // Revert optimistic update on failure by refetching
      await fetchProfile();
      throw err;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, isLoading, updateProfile, refreshProfile: fetchProfile, setProfile, isCreatingAccount, setIsCreatingAccount }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used within ProfileProvider');
  return ctx;
}
