import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppNavigator } from './AppNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getProfile } from '../lib/db';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const checkOnboardingStatus = async () => {
    try {
      // In a real app we'd get the user ID from auth session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setIsOnboarded(false);
        return;
      }

      const profile = await getProfile(userId);
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
    } = supabase.auth.onAuthStateChange(() => {
      setIsLoading(true);
      checkOnboardingStatus();
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
      {isOnboarded ? (
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
