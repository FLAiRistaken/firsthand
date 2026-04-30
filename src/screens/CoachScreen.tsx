import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, FontSizes, Spacing, Radius, BorderWidths } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { callClaude } from '../lib/anthropic';
import { COACH_SYSTEM, sanitizePromptValue } from '../lib/prompts';
import { SendIcon } from '../components/icons/SendIcon';
import { PersonIcon } from '../components/icons/PersonIcon';
import { ArrowIcon } from '../components/icons/ArrowIcon';

const COACH_PROMPTS = [
  "I used AI when I didn't need to",
  "I want to talk about a win",
  "I'm struggling with a habit",
  "I feel like I'm getting worse at thinking",
];

const MAX_MESSAGES = 20;

export default function CoachScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "What's on your mind about your AI use today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Animated dots for typing indicator
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
              Animated.delay(200)
            ])
          )
        ]);
      };

      const anim1 = animateDot(dot1, 0);
      const anim2 = animateDot(dot2, 150);
      const anim3 = animateDot(dot3, 300);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      dot1.setValue(0.3);
      dot2.setValue(0.3);
      dot3.setValue(0.3);
    }
  }, [loading, dot1, dot2, dot3]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function send(textOverride?: string): Promise<void> {
    const content = (textOverride ?? input).trim();
    const userMsg = { role: 'user' as const, content };
    const nextLength = messages.length + 1;

    if (!content || loading || nextLength >= MAX_MESSAGES) return;

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const reply = await callClaude(
        updated,
        COACH_SYSTEM({
          name: sanitizePromptValue(profile?.name ?? ''),
          occupation: sanitizePromptValue(profile?.occupation ?? ''),
          goal: sanitizePromptValue(profile?.goal ?? ''),
          success_definition: sanitizePromptValue(profile?.success_definition ?? ''),
        }),
        120
      );
      setMessages([
        ...updated,
        {
          role: 'assistant',
          content: reply || 'What made you reach for AI in that moment?'
        }
      ]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('callClaude error:', error);
      setMessages([
        ...updated,
        {
          role: 'assistant',
          content: `Error: ${msg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const renderBubble = (m: { role: 'user' | 'assistant'; content: string }, i: number) => {
    const isUser = m.role === 'user';
    const showCoachLabel = !isUser && (i === 0 || messages[i - 1].role === 'user');

    return (
      <View key={i} style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {showCoachLabel && <Text style={styles.coachLabel}>The Coach</Text>}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={isUser ? styles.userBubbleText : styles.assistantBubbleText}>
            {m.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>Firsthand</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <PersonIcon size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Coach Identity Bar */}
        <View style={styles.identityBarContainer}>
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke={Colors.white}
                  strokeWidth="1.5"
                />
                <Path
                  d="M9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12V13"
                  stroke={Colors.white}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M12 17H12.01"
                  stroke={Colors.white}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <View style={styles.identityTextContainer}>
              <Text style={styles.identityName}>The Coach</Text>
              <Text style={styles.identityDesc}>Only asks questions. Never answers them.</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ready</Text>
            </View>
          </View>
        </View>

        {/* Message List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        >
          {messages.map(renderBubble)}

          {loading && (
            <View style={[styles.messageWrapper, styles.messageWrapperAssistant]}>
              <Text style={styles.coachLabel}>The Coach</Text>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
              </View>
            </View>
          )}

          {messages.length <= 1 && (
            <View style={styles.quickPromptsContainer}>
              <Text style={styles.quickPromptsLabel}>Or start with something specific</Text>
              {COACH_PROMPTS.map(p => (
                <TouchableOpacity key={p} style={styles.quickPromptButton} onPress={() => send(p)}>
                  <Text style={styles.quickPromptText}>{p}</Text>
                  <ArrowIcon size={16} color={Colors.textHint} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          {messages.length >= MAX_MESSAGES ? (
            <Text style={styles.capMessage}>
              That's a lot for one session — come back tomorrow.
            </Text>
          ) : (
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="What's on your mind…"
                  placeholderTextColor={Colors.textHint}
                  onSubmitEditing={() => send()}
                  returnKeyType="send"
                  multiline={false}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || loading) && styles.sendButtonDisabled
                ]}
                onPress={() => send()}
                disabled={!input.trim() || loading}
              >
                <SendIcon size={14} color={input.trim() && !loading ? Colors.white : Colors.textHint} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  headerTitle: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBarContainer: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.smLg,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 11,
    paddingHorizontal: Spacing.lg - 2,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTextContainer: {
    flex: 1,
  },
  identityName: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginBottom: BorderWidths.sm,
  },
  identityDesc: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
  },
  messageListContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.smLg,
  },
  messageWrapper: {
    flexDirection: 'column',
  },
  messageWrapperUser: {
    alignItems: 'flex-end',
  },
  messageWrapperAssistant: {
    alignItems: 'flex-start',
  },
  coachLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
    marginBottom: Spacing.xs,
    paddingLeft: 2,
  },
  bubble: {
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: Radius.xl - 2,
    borderTopRightRadius: Radius.xl - 2,
    borderBottomRightRadius: Spacing.xs,
    borderBottomLeftRadius: Radius.xl - 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: Spacing.md,
    elevation: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.cardBg,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: Spacing.xs,
    borderTopRightRadius: Radius.xl - 2,
    borderBottomRightRadius: Radius.xl - 2,
    borderBottomLeftRadius: Radius.xl - 2,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: BorderWidths.sm },
    shadowOpacity: 0.05,
    shadowRadius: Spacing.xs,
    elevation: 1,
  },
  userBubbleText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    lineHeight: FontSizes.xxl,
    color: Colors.white,
  },
  assistantBubbleText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    lineHeight: FontSizes.xxl,
    color: Colors.textPrimary,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.textHint,
  },
  quickPromptsContainer: {
    marginTop: Spacing.sm,
  },
  quickPromptsLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    paddingLeft: 2,
    marginBottom: Spacing.sm,
  },
  quickPromptButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.smLg,
    paddingHorizontal: Spacing.lg - 2,
    borderRadius: Radius.md,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    marginBottom: 6,
  },
  quickPromptText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  quickPromptArrow: {
    fontSize: FontSizes.lg,
    color: Colors.textHint,
  },
  inputArea: {
    flexShrink: 0,
    borderTopWidth: BorderWidths.sm,
    borderColor: Colors.border,
    backgroundColor: Colors.appBg,
  },
  capMessage: {
    padding: Spacing.lg,
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: Spacing.smLg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg - 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderWidth: BorderWidths.md,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.smLg,
    paddingHorizontal: Spacing.lg,
  },
  textInput: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.27,
    shadowRadius: Spacing.md,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.streakEmpty,
    shadowOpacity: 0,
    elevation: 0,
  },
});
