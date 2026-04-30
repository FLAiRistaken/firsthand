import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { AppNavigator } from './AppNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { ProfileProvider, useProfileContext } from '../contexts/ProfileContext';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigatorContent({ session, isLoading: authLoading }: { session: Session | null, isLoading: boolean }) {
  const { profile, isLoading: profileLoading } = useProfileContext();

  const isScreenLoading = authLoading || (!!session && profileLoading);

  if (isScreenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : profile?.onboarded ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { session, isLoading } = useAuth();

  return (
    <ProfileProvider userId={session?.user?.id ?? null}>
      <RootNavigatorContent session={session} isLoading={isLoading} />
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
