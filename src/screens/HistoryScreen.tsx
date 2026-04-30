import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useLogs } from '../hooks/useLogs';
import { useProfile } from '../hooks/useProfile';
import { PillButton } from '../components/PillButton';
import { PersonIcon } from '../components/icons/PersonIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { ChipIcon } from '../components/icons/ChipIcon';
import { EditLogModal } from '../components/EditLogModal';
import type { LogEntry } from '../lib/types';
import Svg, { Path } from 'react-native-svg';

type FilterType = 'all' | 'wins' | 'AI uses';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { logs, editLog } = useLogs(userId);
  const { profile } = useProfile();

  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: true,
  });
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const groupedLogs = useMemo(() => {
    const grouped: Record<string, LogEntry[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const reversedLogs = [...logs].reverse();

    reversedLogs.forEach(l => {
      const d = new Date(l.timestamp).toDateString();
      const label = d === today
        ? 'Today'
        : d === yesterday
          ? 'Yesterday'
          : new Date(l.timestamp).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            });

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(l);
    });

    return grouped;
  }, [logs]);

  const handleSave = async (id: string, updates: Parameters<typeof editLog>[1]) => {
    await editLog(id, updates);
    setEditingLog(null);
  };

  if (!logs.length) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.emptyText}>Nothing logged yet.</Text>
        <Text style={styles.emptyText}>Hit one of the big buttons to start.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>Firsthand</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => {}}>
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
        {Object.entries(groupedLogs).map(([day, entries]) => {
          const wCount = entries.filter((e: any) => e.type === 'win').length;
          const sCount = entries.filter((e: any) => e.type === 'sin').length;
          const total = wCount + sCount;
          const pct = total === 0 ? 0 : Math.round((wCount / total) * 100);
          const isOpen = expandedDays[day] ?? false;

          const filtered = entries.filter((e: any) =>
            filter === 'all'
              ? true
              : filter === 'wins'
                ? e.type === 'win'
                : e.type === 'sin'
          );

          return (
            <View key={day} style={styles.dayGroup}>
              <TouchableOpacity
                onPress={() => toggleDay(day)}
                style={styles.dayHeader}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayLabel}>{day}</Text>
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
                    filtered.map((entry: any) => {
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
                              <ChipIcon size={13} color="#AAA" />
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
        <View style={{ height: 20 }} />
      </ScrollView>

      <EditLogModal
        visible={editingLog !== null}
        log={editingLog}
        onSave={handleSave}
        onClose={() => setEditingLog(null)}
        customCategories={profile?.custom_categories ?? []}
      />
    </View>
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
    fontSize: 24,
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
    color: '#3A7A60',
  },
  contextSin: {
    backgroundColor: '#EDE0CE',
    color: '#A08060',
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
