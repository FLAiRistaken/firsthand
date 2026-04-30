import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { useLogs } from '../hooks/useLogs';
import { useProfile } from '../hooks/useProfile';
import { PillButton } from '../components/PillButton';
import { PersonIcon } from '../components/icons/PersonIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { ChipIcon } from '../components/icons/ChipIcon';
import { EditLogModal } from '../components/EditLogModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
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

    const reversedLogs = [...logs].reverse();

    reversedLogs.forEach(l => {
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

  if (!logs.length) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyText}>Nothing logged yet.</Text>
        <Text style={styles.emptyText}>Hit one of the big buttons to start.</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary onError={(error, errorInfo) => console.error('HistoryScreen error:', error, errorInfo)}>
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
        </View>
      </View>

      {/* Scrollable List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedLogs).map(([dateKey, group]) => {
          const { logs: entries, label } = group as any;
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
        })}
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
    fontSize: 17,
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
    fontSize: 10,
    paddingVertical: 1,
    paddingHorizontal: 7,
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
});
