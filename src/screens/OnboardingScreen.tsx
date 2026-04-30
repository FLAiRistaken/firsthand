import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, FontSizes, Spacing, Radius, BorderWidths, Sizes } from '../constants/theme';
import { callClaude } from '../lib/anthropic';
import { ONBOARDING_SYSTEM, ONBOARDING_COMPLETE_TOKEN, ONBOARDING_HINTS, CoachUserProfile } from '../lib/prompts';
import { upsertProfile } from '../lib/db';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { SendIcon } from '../components/icons/SendIcon';
import { supabase } from '../lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const TypingIndicator = () => {
  const opacities = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(opacities[0], { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(opacities[0], { toValue: 0.3, duration: 300, useNativeDriver: true })
          ]),
          Animated.sequence([
            Animated.timing(opacities[1], { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(opacities[1], { toValue: 0.3, duration: 300, useNativeDriver: true })
          ]),
          Animated.sequence([
            Animated.timing(opacities[2], { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(opacities[2], { toValue: 0.3, duration: 300, useNativeDriver: true })
          ])
        ])
      ).start();
    };
    startAnimation();
  }, []);

  return (
    <View style={[styles.messageWrapper, styles.messageWrapperAssistant]}>
      <View style={styles.assistantMessageBubble}>
        <View style={styles.typingIndicatorContainer}>
          {opacities.map((opacity, i) => (
            <Animated.View key={i} style={[styles.typingDot, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { userId } = useAuth();
  const { refreshProfile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  const profileRef = useRef<CoachUserProfile & { raw_tools?: string; raw_uses?: string }>({ name: '' });
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initConversation = async () => {
      try {
        const response = await callClaude([{ role: 'user', content: 'begin' }], ONBOARDING_SYSTEM);
        setMessages([{ role: 'assistant', content: response }]);
      } catch (err) {
        console.error('Failed to start onboarding:', err);
        setMessages([{ role: 'assistant', content: "Hi there. I'm Firsthand. What's your first name?" }]);
      } finally {
        setLoading(false);
      }
    };
    initConversation();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(step / 6, 1),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    if (showAccountCreation) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showAccountCreation]);

  const handleCreateAccount = async () => {
    const trimmedEmail = accountEmail.trim();
    if (!trimmedEmail || !accountPassword) return;
    if (accountPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setAccountLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: accountPassword,
      });
      
      if (signUpError) {
        const isExisting = signUpError.message.toLowerCase().includes('already');
        if (isExisting) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: accountPassword,
          });
          if (signInError) throw signInError;
        } else {
          throw signUpError;
        }
      }

      // Step 2: Wait for onAuthStateChange to fire and session to be available
      // Poll getSession with retries instead of a fixed wait
      let session = null;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.id) {
          session = data.session;
          break;
        }
      }

      if (!session?.user?.id) {
        throw new Error('Session not established after account creation.');
      }

      const tools = profileRef.current.raw_tools ? profileRef.current.raw_tools.split(',').map((s: string) => s.trim()) : [];
      const uses = profileRef.current.raw_uses ? profileRef.current.raw_uses.split(',').map((s: string) => s.trim()) : [];

      // Step 3: Write profile directly with confirmed userId
      await upsertProfile({
        id: session.user.id,
        name: profileRef.current.name,
        occupation: profileRef.current.occupation || '',
        ai_tools_used: tools,
        primary_uses: uses,
        goal: profileRef.current.goal || '',
        success_definition: profileRef.current.success_definition || '',
        custom_categories: [],
        onboarded: true,
      });

      // Step 4: Force ProfileContext to re-fetch so RootNavigator
      // sees onboarded: true and transitions to App
      await refreshProfile();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      Alert.alert('Account creation failed', message);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || done) return;

    const userContent = input.trim();
    setInput('');
    setLoading(true);

    if (step === 0) profileRef.current.name = userContent.split(' ')[0];
    else if (step === 1) profileRef.current.occupation = userContent;
    else if (step === 2) profileRef.current.raw_tools = userContent;
    else if (step === 3) profileRef.current.raw_uses = userContent;
    else if (step === 4) profileRef.current.goal = userContent;
    else if (step === 5) profileRef.current.success_definition = userContent;

    const newMessages = [...messages, { role: 'user' as const, content: userContent }];
    setMessages(newMessages);

    try {
      const response = await callClaude(newMessages, ONBOARDING_SYSTEM);

      const isComplete = response.includes(ONBOARDING_COMPLETE_TOKEN);
      const cleanResponse = response.replace(ONBOARDING_COMPLETE_TOKEN, '').trim();

      setMessages([...newMessages, { role: 'assistant', content: cleanResponse }]);

      if (isComplete) {
        setDone(true);
        setStep(6);
        setTimeout(() => {
          setShowAccountCreation(true);
        }, 500);
      } else {
        setStep((s: number) => s + 1);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages([...newMessages, { role: 'assistant', content: "Tell me a bit more about that." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.assistantMessageBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderAccountCreation = () => {
    if (!showAccountCreation) return null;

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.divider} />
        <Text style={styles.accountHeading}>One last step.</Text>
        <Text style={styles.accountSubtext}>Create your account to save your progress.</Text>

        <TextInput
          value={accountEmail}
          onChangeText={setAccountEmail}
          placeholder="Email address"
          placeholderTextColor={Colors.textHint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.accountInput}
        />

        <TextInput
          value={accountPassword}
          onChangeText={setAccountPassword}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={Colors.textHint}
          secureTextEntry={true}
          autoCapitalize="none"
          style={[styles.accountInput, { marginTop: Spacing.md }]}
        />

        <TouchableOpacity
          style={styles.accountButton}
          onPress={handleCreateAccount}
          disabled={accountLoading}
          activeOpacity={0.8}
        >
          {accountLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.accountButtonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={[styles.wordmarkContainer, { marginBottom: 0 }]}>
            <View style={styles.greenDot} />
            <Text style={styles.wordmark}>Firsthand</Text>
          </View>
          {step === 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={{ padding: Spacing.sm }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: Colors.textMuted }}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressSubtitle}>Getting to know you</Text>
          <Text style={[styles.progressCount, step >= 6 && styles.progressCountDone]}>
            {step >= 6 ? 'done' : `${step} of 6`}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_: Message, index: number) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <View>
            {loading && <TypingIndicator />}
            {renderAccountCreation()}
          </View>
        }
      />

      {!done && (
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {ONBOARDING_HINTS[step] && (
            <Text style={styles.hintText}>{ONBOARDING_HINTS[step]}</Text>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type your answer…"
              placeholderTextColor={Colors.textHint}
              multiline
              maxLength={200}
              onSubmitEditing={handleSend}
              blurOnSubmit={true}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
            >
              <SendIcon size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  header: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 16,
    flexShrink: 0,
  },
  wordmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.streakEmpty,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  progressCount: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  progressCountDone: {
    color: Colors.primary,
    fontFamily: Fonts.sansMedium,
  },
  messageList: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    maxWidth: '84%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderTopRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  userMessageText: {
    fontFamily: Fonts.sans,
    color: Colors.white,
  },
  assistantMessageText: {
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textHint,
  },
  inputArea: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.appBg,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  hintText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    paddingLeft: 4,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: 11,
    paddingHorizontal: 18,
    fontSize: FontSizes.md,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.27,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.streakEmpty,
    shadowOpacity: 0,
    elevation: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  accountHeading: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  accountSubtext: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  accountInput: {
    backgroundColor: Colors.cardBg,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  accountButton: {
    marginTop: Spacing.md,
    height: Sizes.buttonHeight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  accountButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  loginRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  loginLink: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});
