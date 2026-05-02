import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidths, Colors, Fonts, FontSizes, LetterSpacing, Radius, Sizes, Spacing } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { useLogs } from '../hooks/useLogs';
import { useProfile } from '../hooks/useProfile';
import { PillButton } from '../components/PillButton';
import PersonIcon from '../components/icons/PersonIcon';
import BrainIcon from '../components/icons/BrainIcon';
import ChipIcon from '../components/icons/ChipIcon';
import { EditLogModal } from '../components/EditLogModal';
import ErrorBoundary from '../components/ErrorBoundary';

import type { LogEntry } from '../lib/types';
import Svg, { Path } from 'react-native-svg';

type FilterType = 'all' | 'wins' | 'AI uses';

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { logs, editLog, isLoading, error } = useLogs(userId);
  const { profile } = useProfile();

  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<'log' | 'patterns'>('log');

  // Helper to get today and yesterday date keys
  const getTodayKey = () => new Date().toISOString().slice(0, 10);
  const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  };

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    [getTodayKey()]: true,
    [getYesterdayKey()]: true,
  });
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const groupedLogs = useMemo(() => {
    const grouped: Record<string, { logs: LogEntry[]; label: string }> = {};
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    logs.forEach(l => {
      const logDate = new Date(l.timestamp);
      const dateKey = logDate.toISOString().slice(0, 10); // yyyy-mm-dd
      const d = logDate.toDateString();
      const label = d === today
        ? 'Today'
        : d === yesterday
          ? 'Yesterday'
          : logDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

      if (!grouped[dateKey]) {
        grouped[dateKey] = { logs: [], label };
      }
      grouped[dateKey].logs.push(l);
    });

    return grouped;
  }, [logs]);


  const patternData = useMemo(() => {
    // Hour buckets 0-23
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      wins: 0,
      sins: 0,
    }));

    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (log.type === 'win') hours[hour].wins++;
      else hours[hour].sins++;
    });

    // Day of week buckets Mon=0 to Sun=6
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
      (label, i) => ({ label, index: i, wins: 0, sins: 0 })
    );

    logs.forEach(log => {
      const dayIndex = (new Date(log.timestamp).getDay() + 6) % 7;
      if (log.type === 'win') days[dayIndex].wins++;
      else days[dayIndex].sins++;
    });

    // Category breakdown
    const categoryMap = new Map<string, { wins: number; sins: number }>();
    logs.forEach(log => {
      const counts = categoryMap.get(log.category);
      if (!counts) {
        categoryMap.set(log.category, { wins: 0, sins: 0 });
      }
      const current = categoryMap.get(log.category)!;
      if (log.type === 'win') current.wins++;
      else current.sins++;
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, counts]) => ({ name, ...counts, total: counts.wins + counts.sins }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return { hours, days, categories };
  }, [logs]);

  const handleSave = async (id: string, updates: Parameters<typeof editLog>[1]): Promise<void> => {
    await editLog(id, updates);
    setEditingLog(null);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyText}>Error loading history</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (!logs.length && view !== 'patterns') {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyText}>Nothing logged yet.</Text>
        <Text style={styles.emptyText}>Hit one of the big buttons to start.</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary screenName="History">
      <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>Firsthand</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <PersonIcon size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>History</Text>
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              style={[styles.viewToggleTab, view === 'log' && styles.viewToggleTabSelected]}
              onPress={() => setView('log')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewToggleTabText, view === 'log' && styles.viewToggleTabSelectedText]}>Log</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleTab, view === 'patterns' && styles.viewToggleTabSelected]}
              onPress={() => setView('patterns')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewToggleTabText, view === 'patterns' && styles.viewToggleTabSelectedText]}>Patterns</Text>
            </TouchableOpacity>
          </View>
          {view === 'log' && (
          <View style={styles.filterRow}>
            {(['all', 'wins', 'AI uses'] as FilterType[]).map(f => (
              <PillButton
                key={f}
                label={f}
                selected={filter === f}
                onPress={() => setFilter(f)}
                variant="primary"
              />
            ))}
          </View>
          )}
        </View>
      </View>

      {/* Scrollable List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {view === 'patterns' ? (
          <View style={styles.patternsContainer}>
            {/* Time of Day Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TIME OF DAY</Text>
              <Text style={styles.cardSubtitle}>When you log wins and AI uses</Text>

              {Math.max(...patternData.hours.map(h => h.wins + h.sins)) === 0 ? (
                <Text style={styles.noDataText}>No data yet</Text>
              ) : (
                <View>
                  <View style={styles.chartContainer}>
                    {(() => {
                      const maxScale = Math.max(...patternData.hours.map(hr => hr.wins + hr.sins));
                      return patternData.hours.map(h => {
                        const winHeight = maxScale > 0 ? (h.wins / maxScale) * 60 : 0;
                        const sinHeight = maxScale > 0 ? (h.sins / maxScale) * 60 : 0;

                        return (
                          <View key={h.hour} style={styles.column}>
                            {h.sins > 0 && (
                              <View style={[styles.sinBar, { height: sinHeight }]} />
                            )}
                            {h.wins > 0 && (
                              <View style={[styles.winBar, { height: winHeight, marginTop: h.sins > 0 ? 1 : 0 }]} />
                            )}
                          </View>
                        );
                      });
                    })()}
                  </View>
                  <View style={styles.xAxisLabels}>
                    {['12a', '4a', '8a', '12p', '4p', '8p'].map((label, i) => (
                      <Text key={i} style={styles.xAxisLabelText}>{label}</Text>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotPrimary]} />
                  <Text style={styles.legendText}>Wins</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotAmber]} />
                  <Text style={styles.legendText}>AI uses</Text>
                </View>
              </View>
            </View>

            {/* Day of Week Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>DAY OF WEEK</Text>
              <Text style={styles.cardSubtitle}>Your pattern across the week</Text>

              {Math.max(...patternData.days.map(d => d.wins + d.sins)) === 0 ? (
                <Text style={styles.noDataText}>No data yet</Text>
              ) : (
                <View>
                  <View style={styles.daysChartContainer}>
                    {(() => {
                      const maxScale = Math.max(...patternData.days.map(day => day.wins + day.sins));
                      return patternData.days.map(d => {
                        const winHeight = maxScale > 0 ? (d.wins / maxScale) * 60 : 0;
                        const sinHeight = maxScale > 0 ? (d.sins / maxScale) * 60 : 0;

                        return (
                          <View key={d.label} style={styles.dayColumn}>
                            <View style={styles.dayBarsWrap}>
                              {d.sins > 0 && (
                                <View style={[styles.sinBar, { height: sinHeight }]} />
                              )}
                              {d.wins > 0 && (
                                <View style={[styles.winBar, { height: winHeight, marginTop: d.sins > 0 ? 1 : 0 }]} />
                              )}
                            </View>
                            <Text style={styles.dayLabelText}>{d.label}</Text>
                          </View>
                        );
                      });
                    })()}
                  </View>

                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotPrimary]} />
                      <Text style={styles.legendText}>Wins</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotAmber]} />
                      <Text style={styles.legendText}>AI uses</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Top Categories Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TOP CATEGORIES</Text>
              <Text style={styles.cardSubtitle}>Where your effort goes</Text>

              {patternData.categories.length === 0 ? (
                <Text style={styles.noDataText}>No data yet</Text>
              ) : (
                patternData.categories.map(c => (
                  <View key={c.name} style={styles.categoryRow}>
                    <Text style={styles.categoryName} numberOfLines={1}>{c.name}</Text>
                    <View style={styles.categoryTrack}>
                      <View style={styles.rowFlex}>
                        {c.wins > 0 && (
                          <View style={[styles.categoryWinFill, { flex: c.wins }]} />
                        )}
                        {c.sins > 0 && (
                          <View style={[styles.categorySinFill, { flex: c.sins }]} />
                        )}
                      </View>
                    </View>
                    <Text style={styles.categoryTotal}>{c.total}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
        Object.entries(groupedLogs).map(([dateKey, { logs: entries, label }]) => {
          const wCount = entries.filter((e: LogEntry) => e.type === 'win').length;
          const sCount = entries.filter((e: LogEntry) => e.type === 'sin').length;
          const total = wCount + sCount;
          const pct = total === 0 ? 0 : Math.round((wCount / total) * 100);
          const isOpen = expandedDays[dateKey] ?? false;

          const filtered = entries.filter((e: LogEntry) =>
            filter === 'all'
              ? true
              : filter === 'wins'
                ? e.type === 'win'
                : e.type === 'sin'
          );

          return (
            <View key={dateKey} style={styles.dayGroup}>
              <TouchableOpacity
                onPress={() => toggleDay(dateKey)}
                style={styles.dayHeader}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  <Text style={styles.dayCounts}>
                    {wCount}W · {sCount}A
                  </Text>
                </View>

                <View style={styles.dayHeaderRight}>
                  <View style={styles.ratioBarWrap}>
                    <View style={styles.ratioTrack}>
                      <View style={[styles.ratioFill, { width: `${pct}%` }]} />
                    </View>
                    <Text
                      style={[
                        styles.ratioPctText,
                        { color: pct >= 50 ? Colors.primary : Colors.amber },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </View>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path
                      d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                      stroke={Colors.textHint}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.entriesList}>
                  {filtered.length === 0 ? (
                    <Text style={styles.noEntriesText}>
                      No {filter} for this day
                    </Text>
                  ) : (
                    filtered.map((entry: LogEntry) => {
                      const isWin = entry.type === 'win';
                      return (
                        <TouchableOpacity
                          key={entry.id}
                          style={[
                            styles.entryRow,
                            isWin ? styles.entryWin : styles.entrySin,
                          ]}
                          onPress={() => setEditingLog(entry)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.entryIcon,
                              isWin ? styles.iconWin : styles.iconSin,
                            ]}
                          >
                            {isWin ? (
                              <BrainIcon size={13} color="white" />
                            ) : (
                              <ChipIcon size={13} color={Colors.sinIconColor} />
                            )}
                          </View>

                          <View style={styles.entryContent}>
                            <View style={styles.entryContentTop}>
                              <Text
                                style={[
                                  styles.entryCategory,
                                  { color: isWin ? Colors.primary : Colors.sinCategoryText },
                                ]}
                              >
                                {entry.category}
                              </Text>
                              {entry.context && (
                                <Text
                                  style={[
                                    styles.entryContext,
                                    isWin
                                      ? styles.contextWin
                                      : styles.contextSin,
                                  ]}
                                >
                                  {entry.context}
                                </Text>
                              )}
                            </View>
                            {entry.note ? (
                              <Text style={styles.entryNote} numberOfLines={1}>
                                {entry.note}
                              </Text>
                            ) : null}
                          </View>

                          <Text style={styles.entryTime}>
                            {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })
        )}
        <View style={styles.spacer20} />
      </ScrollView>

      <EditLogModal
        visible={editingLog !== null}
        log={editingLog}
        onSave={handleSave}
        onClose={() => setEditingLog(null)}
        customCategories={profile?.custom_categories ?? []}
      />
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  centerAll: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textHint,
    lineHeight: 25.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  brandText: {
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
  titleRow: {
    paddingBottom: 0,
  },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  viewToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  viewToggleTab: {
    paddingVertical: Spacing.tabPaddingVertical,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
    backgroundColor: Colors.transparent,
  },
  viewToggleTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  viewToggleTabText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
  },
  viewToggleTabSelectedText: {
    color: Colors.white,
    fontFamily: Fonts.sansMedium,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  spacer20: {
    height: Spacing.xl,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  dayCounts: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textHint,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratioBarWrap: {
    width: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratioTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratioFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  ratioPctText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
  },
  entriesList: {
    flexDirection: 'column',
    gap: 6,
  },
  noEntriesText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textHint,
    paddingVertical: 12,
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  entryWin: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  entrySin: {
    backgroundColor: Colors.sinBg,
    borderColor: Colors.sinBorder,
  },
  entryIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWin: {
    backgroundColor: Colors.primary,
  },
  iconSin: {
    backgroundColor: Colors.sinIconBg,
  },
  entryContent: {
    flex: 1,
    minWidth: 0,
  },
  entryContentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryCategory: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
  },
  entryContext: {
    fontSize: FontSizes.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    fontFamily: Fonts.sansMedium,
    overflow: 'hidden',
  },
  contextWin: {
    backgroundColor: Colors.primaryBorder,
    color: Colors.contextWinText,
  },
  contextSin: {
    backgroundColor: Colors.contextSinBg,
    color: Colors.contextSinText,
  },
  entryNote: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 18.2,
  },
  entryTime: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    flexShrink: 0,
  },
  patternsContainer: {
    gap: Spacing.lg,
    paddingTop: 0,
  },
  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.primary,
    letterSpacing: LetterSpacing.cardLabel,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  noDataText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textHint,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: Sizes.chartHeight,
    gap: Spacing.xxs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  winBar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xs,
    maxHeight: 60,
    minHeight: 0,
  },
  sinBar: {
    width: '100%',
    backgroundColor: Colors.amber,
    borderRadius: Radius.xs,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xsMd,
  },
  xAxisLabelText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xsMd,
  },
  legendDot: {
    width: Sizes.dotSize,
    height: Sizes.dotSize,
    borderRadius: Radius.full,
  },
  legendDotPrimary: {
    backgroundColor: Colors.primary,
  },
  legendDotAmber: {
    backgroundColor: Colors.amber,
  },
  legendText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  rowFlex: {
    flex: 1,
    flexDirection: 'row',
  },
  daysChartContainer: {
    flexDirection: 'row',
    height: Sizes.chartHeight,
    gap: Spacing.xs,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayBarsWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  dayLabelText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
    marginTop: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.smLg,
    marginBottom: Spacing.smLg,
  },
  categoryName: {
    width: Sizes.categoryNameWidth,
    flexShrink: 0,
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  categoryTrack: {
    flex: 1,
    height: Sizes.categoryTrackHeight,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  categoryWinFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  categorySinFill: {
    height: '100%',
    backgroundColor: Colors.amber,
  },
  categoryTotal: {
    width: Sizes.categoryTotalWidth,
    textAlign: 'right',
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
  },
});
