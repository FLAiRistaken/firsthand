import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useLogs } from '../hooks/useLogs';
import { useStats } from '../hooks/useStats';
import { useProfile } from '../hooks/useProfile';
import { PersonIcon } from '../components/icons/PersonIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { ChipIcon } from '../components/icons/ChipIcon';
import { Card } from '../components/Card';
import { Toast } from '../components/Toast';
import { LogModal } from '../components/LogModal';
import Svg, { Polyline } from 'react-native-svg';
import { LogEntry, LogContext } from '../lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { logs, addLog } = useLogs(userId);
  const {
    todayLogs, todayWins, todaySins, streak, weekRatio,
    personalAvg, aboveAverage, streakDots
  } = useStats(logs);
  const { profile, updateProfile } = useProfile(userId);
  const insets = useSafeAreaInsets();

  const [modalType, setModalType] = useState<'win' | 'sin' | null>(null);
  const [showTodayLogs, setShowTodayLogs] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'win' | 'sin'>('win');

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

  const handleSaveLog = async (entry: { type: 'win' | 'sin'; category: string; note: string; context: LogContext | undefined }) => {
    try {
      await addLog(entry);
      setToastType(entry.type);
      setToastVisible(true);
      setModalType(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (cat: string) => {
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
            <ChipIcon size={46} color="#8B6914" />
          </View>
          <ChipIcon size={18} color="#C4A882" />
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
                  {personalAvg !== null && (
                    <View style={[
                      styles.ratioBadge,
                      aboveAverage ? styles.ratioBadgeAbove : styles.ratioBadgeBelow
                    ]}>
                      <Text style={[
                        styles.ratioBadgeText,
                        aboveAverage ? styles.ratioBadgeTextAbove : styles.ratioBadgeTextBelow
                      ]}>
                        {aboveAverage ? '↑' : '↓'}{Math.abs(weekRatio - personalAvg)}% {aboveAverage ? 'above' : 'below'} avg
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
                {renderStreakDot(hasWin, i === 6, i)}
                <Text style={[
                  styles.dayLabel,
                  i === 6 && styles.dayLabelToday,
                  i !== 6 && hasWin && styles.dayLabelWin,
                  i !== 6 && !hasWin && styles.dayLabelEmpty,
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
                        {isWin ? <BrainIcon size={11} color={Colors.white} /> : <ChipIcon size={11} color="#AAA" />}
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
        <View style={{ height: Spacing.screen }} />
      </ScrollView>

      <LogModal
        visible={modalType !== null}
        type={modalType ?? 'win'}
        onSave={handleSaveLog}
        onClose={() => setModalType(null)}
        customCategories={profile?.custom_categories ?? []}
        onAddCategory={handleAddCategory}
      />

      <Toast
        visible={toastVisible}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingBottom: 10,
    backgroundColor: Colors.appBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 30,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  greetingSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300', // sansLight approx
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: 5,
  },
  winButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
    paddingVertical: 24,
    paddingHorizontal: 22,
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
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
    fontSize: 21,
    color: Colors.white,
    marginBottom: 2,
    marginTop: 9,
  },
  winSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },
  sinButton: {
    backgroundColor: Colors.sinBg,
    borderWidth: 1.5,
    borderColor: Colors.sinBorder,
    borderRadius: Radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 14,
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
    fontSize: 19,
    color: '#5A4A38',
    marginBottom: 2,
    marginTop: 8,
  },
  sinSubtitle: {
    fontFamily: Fonts.sans,
    fontWeight: '300',
    fontSize: 13,
    color: '#B8A898',
  },
  statsCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
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
    fontSize: 22,
    color: Colors.primary,
  },
  statValueSin: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 22,
    color: Colors.amber,
  },
  statValueStreak: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 22,
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
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  ratioBadgeAbove: {
    backgroundColor: Colors.primaryLight,
  },
  ratioBadgeBelow: {
    backgroundColor: '#FFF3E0',
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
    fontSize: 20,
    color: Colors.primary,
  },
  ratioBarBg: {
    height: 4,
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
    marginVertical: 4,
  },
  ratioDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
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
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dotCheck: {
    width: 10,
    height: 10,
  },
  dotTodayEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.streakToday,
  },
  dotTodayInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.streakToday,
  },
  dotPastEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
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
    borderColor: '#C8E2D5',
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
    backgroundColor: '#DDD5C8',
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
    color: '#7A6654',
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
});
