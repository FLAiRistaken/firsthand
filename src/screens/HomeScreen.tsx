import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, BorderWidths } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useLogs } from '../hooks/useLogs';
import { useStats } from '../hooks/useStats';
import { useProfile } from '../hooks/useProfile';
import { PersonIcon } from '../components/icons/PersonIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { ChipIcon } from '../components/icons/ChipIcon';
import { Card } from '../components/Card';
import { LogModal } from '../components/LogModal';
import Svg, { Polyline } from 'react-native-svg';
import { LogContext, LogEntry } from '../lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { logs, addLog, deleteLog, isLoading: logsLoading } = useLogs(userId);
  const {
    todayLogs, todayWins, todaySins, streak, weekRatio,
    personalAvg, ratioDiff, aboveAverage, streakDots
  } = useStats(logs);
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();
  const insets = useSafeAreaInsets();

  const isLoading = logsLoading || profileLoading;

  const [modalType, setModalType] = useState<'win' | 'sin' | null>(null);
  const [showTodayLogs, setShowTodayLogs] = useState<boolean>(false);
  const [undoTargets, setUndoTargets] = useState<Map<string, LogEntry>>(new Map());
  const undoTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const greeting = profile?.name ? `${greetingTime}, ${profile.name}.` : `${greetingTime}.`;

  let subtitle = '';
  if (todayWins === 0 && todaySins === 0) {
    subtitle = 'What are you working on today?';
  } else if (todayWins > todaySins) {
    subtitle = `${todayWins} win${todayWins > 1 ? 's' : ''} today. Your brain is working.`;
  } else if (todaySins > todayWins) {
    subtitle = `${todaySins} AI use${todaySins > 1 ? 's' : ''} today. Awareness is the start.`;
  } else {
    subtitle = 'Balanced day so far.';
  }


  useEffect(() => {
    return () => {
      // Clear all timers on unmount
      undoTimersRef.current.forEach(timer => clearTimeout(timer));
      undoTimersRef.current.clear();
    };
  }, []);

  const showUndoToast = (entry: LogEntry) => {
    // Add entry to the undo collection
    setUndoTargets(prev => new Map(prev).set(entry.id, entry));

    // Create a timeout tied to this specific entry
    const timer = setTimeout(() => {
      // Remove only this entry after 30s
      setUndoTargets(prev => {
        const next = new Map(prev);
        next.delete(entry.id);
        return next;
      });
      undoTimersRef.current.delete(entry.id);
    }, 30000);

    // Store the timer for this entry
    undoTimersRef.current.set(entry.id, timer);
  };

  const isErrorWithCode = (err: unknown): err is Error & { code?: string } => {
    return err instanceof Error && 'code' in err;
  };

  const handleUndo = async (entryId: string): Promise<void> => {
    const target = undoTargets.get(entryId);
    if (!target) return;

    try {
      await deleteLog(target.id);
      // Success: clear this specific entry from undo UI and cancel its timer
      setUndoTargets(prev => {
        const next = new Map(prev);
        next.delete(entryId);
        return next;
      });
      const timer = undoTimersRef.current.get(entryId);
      if (timer) {
        clearTimeout(timer);
        undoTimersRef.current.delete(entryId);
      }
    } catch (err: unknown) {
      if (isErrorWithCode(err) && err.code === 'EXPIRED') {
        Alert.alert('Too late to undo', 'Logs can only be undone within 30 seconds.');
      } else {
        // Failure: keep the undo target and timer intact so user can retry
        Alert.alert('Could not undo', 'The log could not be removed. Try again.');
      }
    }
  };

  const handleSaveLog = async (entry: { type: 'win' | 'sin'; category: string; note: string; context: LogContext | undefined }): Promise<void> => {
    try {
      const newLog = await addLog(entry);
      showUndoToast(newLog);
      setModalType(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (cat: string): Promise<void> => {
    const currentCats = profile?.custom_categories ?? [];
    if (!currentCats.includes(cat)) {
      await updateProfile({ custom_categories: [...currentCats, cat] });
    }
  };

  const renderStreakDot = (hasWin: boolean, isToday: boolean, index: number) => {
    if (hasWin) {
      return (
        <View key={index} style={[styles.dotContainer, styles.dotWin]}>
          <Svg viewBox="0 0 10 10" style={styles.dotCheck}>
            <Polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="2" fill="none" />
          </Svg>
        </View>
      );
    }
    if (isToday) {
      return (
        <View key={index} style={[styles.dotContainer, styles.dotTodayEmpty]}>
          <View style={styles.dotTodayInner} />
        </View>
      );
    }
    return <View key={index} style={[styles.dotContainer, styles.dotPastEmpty]} />;
  };

  // Mon=0 ... Sun=6 mapping that matches the streakDots array order (Mon-Sun)
  const todayIndex = (new Date().getDay() + 6) % 7;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.greenDot} />
          <Text style={styles.headerTitle}>Firsthand</Text>
        </View>
        <View style={styles.headerRight}>
          <PersonIcon size={18} color={Colors.textSecondary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingName}>{greeting}</Text>
          <Text style={styles.greetingSubtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.winButton}
          activeOpacity={0.9}
          onPress={() => setModalType('win')}
        >
          <View style={styles.winGhostIcon}>
            <BrainIcon size={52} color={Colors.white} />
          </View>
          <BrainIcon size={19} color="rgba(255,255,255,0.8)" />
          <Text style={styles.winTitle}>I did it myself</Text>
          <Text style={styles.winSubtitle}>A rep for your brain</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sinButton}
          activeOpacity={0.9}
          onPress={() => setModalType('sin')}
        >
          <View style={styles.sinGhostIcon}>
            <ChipIcon size={46} color={Colors.amberDark} />
          </View>
          <ChipIcon size={18} color={Colors.sinIconMuted} />
          <Text style={styles.sinTitle}>I used AI</Text>
          <Text style={styles.sinSubtitle}>No judgment — just awareness</Text>
        </TouchableOpacity>

        <Card style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValueWin}>{todayWins}</Text>
            <Text style={styles.statLabel}>wins today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValueSin}>{todaySins}</Text>
            <Text style={styles.statLabel}>AI uses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValueStreak}>{streak}d</Text>
            <Text style={styles.statLabel}>streak</Text>
          </View>
        </Card>

        <Card style={styles.ratioCard}>
          {weekRatio !== null ? (
            <>
              <View style={styles.ratioRow}>
                <Text style={styles.ratioLabel}>Own work — 7 days</Text>
                <View style={styles.ratioRight}>
                  {ratioDiff !== null && ratioDiff !== 0 && (
                    <View style={[
                      styles.ratioBadge,
                      aboveAverage ? styles.ratioBadgeAbove : styles.ratioBadgeBelow
                    ]}>
                      <Text style={[
                        styles.ratioBadgeText,
                        aboveAverage ? styles.ratioBadgeTextAbove : styles.ratioBadgeTextBelow
                      ]}>
                        {aboveAverage ? '↑' : '↓'}{Math.abs(ratioDiff)}% {aboveAverage ? 'above' : 'below'} avg
                      </Text>
                    </View>
                  )}
                  <Text style={styles.ratioValue}>{weekRatio}%</Text>
                </View>
              </View>
              <View style={styles.ratioBarBg}>
                <View style={[styles.ratioBarFill, { width: `${weekRatio}%` }]} />
              </View>
            </>
          ) : (
            <Text style={styles.ratioPlaceholder}>Log wins and sins to see your ratio</Text>
          )}

          <View style={styles.ratioDivider} />

          <View style={styles.dotsRow}>
            {streakDots.map((hasWin, i) => (
              <View key={`day-${i}`} style={styles.dayCol}>
                {renderStreakDot(hasWin, i === todayIndex, i)}
                <Text style={[
                  styles.dayLabel,
                  i === todayIndex && styles.dayLabelToday,
                  i !== todayIndex && hasWin && styles.dayLabelWin,
                  i !== todayIndex && !hasWin && styles.dayLabelEmpty,
                ]}>
                  {DAY_LABELS[i]}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {todayLogs.length > 0 && (
          <View style={styles.logsSection}>
            <TouchableOpacity
              style={styles.logsHeader}
              onPress={() => setShowTodayLogs(!showTodayLogs)}
              activeOpacity={0.7}
            >
              <Text style={styles.logsHeaderTitle}>TODAY · {todayLogs.length} LOGGED</Text>
              <Text style={styles.logsHeaderAction}>{showTodayLogs ? 'hide' : 'show'}</Text>
            </TouchableOpacity>

            {showTodayLogs && (
              <View style={styles.logsList}>
                {[...todayLogs].reverse().map((log) => {
                  const isWin = log.type === 'win';
                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  return (
                    <View key={log.id} style={[styles.logItem, isWin ? styles.logItemWin : styles.logItemSin]}>
                      <View style={[styles.logIconCircle, isWin ? styles.logIconCircleWin : styles.logIconCircleSin]}>
                        {isWin ? <BrainIcon size={11} color={Colors.white} /> : <ChipIcon size={11} color={Colors.textMuted} />}
                      </View>
                      <Text style={[styles.logCategoryText, isWin ? styles.logCategoryTextWin : styles.logCategoryTextSin]} numberOfLines={1}>
                        {log.category}
                        {log.note && <Text style={styles.logNoteText}> — {log.note}</Text>}
                      </Text>
                      <Text style={styles.logTimeText}>{timeStr}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <LogModal
        visible={modalType !== null}
        type={modalType ?? 'win'}
        onSave={handleSaveLog}
        onClose={() => setModalType(null)}
        customCategories={profile?.custom_categories ?? []}
        onAddCategory={handleAddCategory}
      />

      {undoTargets.size > 0 && (() => {
        // Show the most recent entry (last added to the Map)
        const entries = Array.from(undoTargets.values());
        const mostRecentEntry = entries[entries.length - 1];
        return (
          <View style={[styles.undoToastWrapper, { top: insets.top + 12 }]}>
            <Card style={styles.undoCard}>
              <View style={[styles.undoIconCircle, mostRecentEntry.type === 'win' ? styles.undoIconCircleWin : styles.undoIconCircleSin]}>
                {mostRecentEntry.type === 'win' ? <BrainIcon size={12} color={Colors.white} /> : <ChipIcon size={12} color={Colors.textMuted} />}
              </View>
              <View style={styles.undoTextBlock}>
                <Text style={styles.undoTitleText}>
                  {mostRecentEntry.category} logged
                  {undoTargets.size > 1 && ` (+${undoTargets.size - 1} more)`}
                </Text>
                <Text style={styles.undoHintText}>Tap undo to remove it</Text>
              </View>
              <TouchableOpacity onPress={() => handleUndo(mostRecentEntry.id)} style={styles.undoButton}>
                <Text style={styles.undoButtonText}>Undo</Text>
              </TouchableOpacity>
            </Card>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.appBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.smLg,
    backgroundColor: Colors.appBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greenDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.streakEmpty,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 10,
  },
  greetingBlock: {
    marginBottom: 22,
  },
  greetingName: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.hero,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  greetingSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300', // sansLight approx
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 1,
  },
  winButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.smLg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: Radius.lg,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  winGhostIcon: {
    position: 'absolute',
    right: 22,
    top: '50%',
    marginTop: -26,
    opacity: 0.1,
  },
  winTitle: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xl,
    color: Colors.white,
    marginBottom: 2,
    marginTop: Spacing.smLg - 1,
  },
  winSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300',
    fontSize: FontSizes.base,
    color: Colors.white,
    opacity: 0.55,
  },
  sinButton: {
    backgroundColor: Colors.sinBg,
    borderWidth: 1.5,
    borderColor: Colors.sinBorder,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.lg + 2,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg - 2,
    position: 'relative',
    overflow: 'hidden',
  },
  sinGhostIcon: {
    position: 'absolute',
    right: 22,
    top: '50%',
    marginTop: -23,
    opacity: 0.1,
  },
  sinTitle: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xl - 2,
    color: Colors.sinText,
    marginBottom: 2,
    marginTop: Spacing.sm,
  },
  sinSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300',
    fontSize: FontSizes.base,
    color: Colors.sinTextLight,
  },
  statsCard: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.smLg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statValueWin: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl - 2,
    color: Colors.primary,
  },
  statValueSin: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl - 2,
    color: Colors.amber,
  },
  statValueStreak: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl - 2,
    color: Colors.textSecondary,
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    marginTop: 3,
  },
  ratioCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratioLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  ratioRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratioBadge: {
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm - 1,
    borderRadius: Radius.sm,
  },
  ratioBadgeAbove: {
    backgroundColor: Colors.primaryLight,
  },
  ratioBadgeBelow: {
    backgroundColor: Colors.amberLight,
  },
  ratioBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.sansMedium,
  },
  ratioBadgeTextAbove: {
    color: Colors.primary,
  },
  ratioBadgeTextBelow: {
    color: Colors.amber,
  },
  ratioValue: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xl - 1,
    color: Colors.primary,
  },
  ratioBarBg: {
    height: Spacing.xs,
    backgroundColor: Colors.border,
    borderRadius: 2,
    width: '100%',
  },
  ratioBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  ratioPlaceholder: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    textAlign: 'center',
    marginVertical: Spacing.xs,
  },
  ratioDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.smLg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm - 2,
    paddingHorizontal: 2,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dotContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotWin: {
    backgroundColor: Colors.primary,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.primary,
  },
  dotCheck: {
    width: Spacing.smLg,
    height: Spacing.smLg,
  },
  dotTodayEmpty: {
    backgroundColor: 'transparent',
    borderWidth: BorderWidths.sm,
    borderColor: Colors.streakToday,
  },
  dotTodayInner: {
    width: Spacing.xs - 1,
    height: Spacing.xs - 1,
    borderRadius: 1.5,
    backgroundColor: Colors.streakToday,
  },
  dotPastEmpty: {
    backgroundColor: 'transparent',
    borderWidth: BorderWidths.sm,
    borderColor: Colors.streakEmpty,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
  },
  dayLabelToday: {
    color: Colors.primary,
    fontFamily: Fonts.sansMedium,
  },
  dayLabelWin: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
  },
  dayLabelEmpty: {
    color: Colors.streakEmpty,
    fontFamily: Fonts.sans,
  },
  logsSection: {
    marginTop: 10,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  logsHeaderTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    letterSpacing: 0.08,
  },
  logsHeaderAction: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  logsList: {
    marginTop: 5,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: 5,
  },
  logItemWin: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  logItemSin: {
    backgroundColor: Colors.sinBg,
    borderWidth: 1,
    borderColor: Colors.sinBorder,
  },
  logIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logIconCircleWin: {
    backgroundColor: Colors.primary,
  },
  logIconCircleSin: {
    backgroundColor: Colors.sinIconBg,
  },
  logCategoryText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
  },
  logCategoryTextWin: {
    color: Colors.primary,
  },
  logCategoryTextSin: {
    color: Colors.sinCategoryText,
  },
  logNoteText: {
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
  logTimeText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  bottomSpacer: {
    height: Spacing.screen,
  },

  undoToastWrapper: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 100,
  },
  undoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cardBg,
    borderColor: Colors.border,
    borderWidth: BorderWidths.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Radius.sm,
    elevation: 4,
  },
  undoIconCircle: {
    width: Spacing.xxl + 4,
    height: Spacing.xxl + 4,
    borderRadius: Radius.full,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoIconCircleWin: {
    backgroundColor: Colors.primary,
  },
  undoIconCircleSin: {
    backgroundColor: Colors.sinIconBg,
  },
  undoTextBlock: {
    flex: 1,
    marginTop: Spacing.xs / 2,
  },
  undoTitleText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  undoHintText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
  },
  undoButton: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
  },
  undoButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
});