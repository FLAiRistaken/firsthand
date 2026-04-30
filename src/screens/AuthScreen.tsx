import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, TextInput, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Sizes, BorderWidths } from '../constants/theme';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '../lib/googleSignIn';
import { supabase } from '../lib/supabase';
import Svg, { Path } from 'react-native-svg';

const GoogleIcon = () => (
  <Svg width={Sizes.iconSm} height={Sizes.iconSm} viewBox="0 0 18 18" fill="none">
    <Path
      d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      fill={Colors.googleBlue}
    />
    <Path
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      fill={Colors.googleGreen}
    />
    <Path
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275V9.62182C0.347727 8.42318 0 7.07318 0 5.65C0 4.22682 0.347727 2.87682 0.957275 1.67818L3.96409 4.01C4.67182 1.88273 6.65591 0.299545 9 0.299545C10.2109 0.299545 11.2418 0.618636 12.0477 1.15864L14.9564 -1.10045C13.4673 -2.475 11.43 -3.28091 9 -3.28091C5.48182 -3.28091 2.43818 -1.26409 0.957275 1.67818H3.96409Z"
      fill={Colors.googleYellow}
      transform="translate(0, 3.3218)"
    />
    <Path
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      fill={Colors.googleRed}
    />
  </Svg>
);

export default function AuthScreen() {
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'macos') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch((err) => console.error('Apple authentication availability check failed:', err));
    }

    // Intentionally public for client-side OAuth
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    if (!webClientId || !iosClientId) {
      setGoogleConfigError('Google Sign-In is unavailable: missing environment configuration.');
    } else {
      GoogleSignin.configure({ webClientId, iosClientId });
    }
  }, []);

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('Apple Sign-In failed: identity token is missing.');
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (error: unknown) {
      if (
        !(
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
        )
      ) {
        console.error('Apple sign in error:', error);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) return;
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setEmailLoading(true);
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
        });
        if (error) throw error;
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Click it to activate your account, then sign in.'
        );
        setAuthMode('signin');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      Alert.alert('Sign in failed', message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.greenDot} />
            <Text style={styles.wordmark}>Firsthand</Text>
          </View>
          <Text style={styles.tagline}>Your thinking. Your work.</Text>
        </View>

        <View style={styles.buttonContainer}>
          {appleAvailable && (
            <View style={styles.appleButtonWrapper}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={14}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
              {appleLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.googleButton,
              (googleConfigError || (__DEV__ && Platform.OS === 'ios')) && styles.googleButtonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || !!googleConfigError || (__DEV__ && Platform.OS === 'ios')}
            activeOpacity={0.7}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <GoogleIcon />
                </View>
                <Text
                  style={[
                    styles.googleButtonText,
                    (googleConfigError || (__DEV__ && Platform.OS === 'ios')) && styles.googleButtonTextDisabled,
                  ]}
                >
                  {googleConfigError
                    ? 'Google Sign-In unavailable'
                    : __DEV__ && Platform.OS === 'ios'
                    ? 'Available in full build'
                    : 'Continue with Google'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Requires: Supabase dashboard -> Authentication -> Providers -> Email -> Enable */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={64}
            style={{ width: '100%' }}
          >
            <ScrollView
              contentContainerStyle={styles.emailForm}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={Colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.textHint}
                secureTextEntry={true}
                autoCapitalize="none"
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleEmailAuth}
                disabled={emailLoading}
                activeOpacity={0.8}
              >
                {emailLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {authMode === 'signin' ? 'Sign in' : 'Create account'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleTextMuted}>
                  {authMode === 'signin'
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                  <Text style={styles.toggleTextAction}>
                    {authMode === 'signin' ? 'Create one' : 'Sign in'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <Text style={styles.finePrint}>
          By continuing you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  wordmark: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontWeight: '300', // sansLight mapping
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.smLg,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  appleButtonWrapper: {
    position: 'relative',
    width: '100%',
  },
  appleButton: {
    width: '100%',
    height: Sizes.buttonHeight,
  },
  googleButton: {
    width: '100%',
    height: Sizes.buttonHeight,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: BorderWidths.sm,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    marginRight: Spacing.smLg,
  },
  googleButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  googleButtonDisabled: {
    backgroundColor: Colors.appBg,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  googleButtonTextDisabled: {
    color: Colors.textMuted,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    zIndex: 1,
  },
  finePrint: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    height: BorderWidths.sm,
    flex: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  emailForm: {
    width: '100%',
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: BorderWidths.md,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  primaryButton: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  toggleTextMuted: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  toggleTextAction: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});
