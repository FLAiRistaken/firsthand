import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { AppNavigator } from './AppNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import { getProfile } from '../lib/db';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { DEV_BYPASS_AUTH, DEV_USER } from '../lib/devConfig';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const checkOnboardingStatus = async (providedSession?: Session | null) => {
    // DEV ONLY — remove before production build
    // Toggle setIsOnboarded(false/true) to test onboarding or main app directly
    if (DEV_BYPASS_AUTH) {
      setSession({ user: DEV_USER } as any);
      setIsOnboarded(false); // Set to false to test onboarding, true to skip to main app
      setIsLoading(false);
      return;
    }

    try {
      let activeSession = providedSession;
      if (activeSession === undefined) {
        const {
          data: { session: fetchedSession },
        } = await supabase.auth.getSession();
        activeSession = fetchedSession;
      }

      setSession(activeSession);

      if (!activeSession?.user?.id) {
        setIsOnboarded(false);
        return;
      }

      const profile = await getProfile(activeSession.user.id);
      setIsOnboarded(!!profile?.onboarded);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, listenerSession) => {
      setIsLoading(true);
      checkOnboardingStatus(listenerSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : isOnboarded ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
