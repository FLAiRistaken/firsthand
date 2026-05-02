import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../constants/theme';
import TabHomeIcon from './icons/TabHomeIcon';
import TabHistoryIcon from './icons/TabHistoryIcon';
import TabCoachIcon from './icons/TabCoachIcon';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', Icon: TabHomeIcon },
    { name: 'History', Icon: TabHistoryIcon },
    { name: 'Coach', Icon: TabCoachIcon },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.xxl),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.name;
        const color = isFocused ? Colors.primary : Colors.tabInactive;

        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => onTabPress(tab.name)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <tab.Icon
              size={22}
              color={color}
              filled={isFocused}
            />
            <Text
              style={[
                styles.label,
                { color }
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: Spacing.hairline,
    borderTopColor: Colors.inkHair,
    backgroundColor: Colors.appBg,
    paddingTop: Spacing.smLg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
