import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '../constants/theme';

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  activeColor?: string;
  activeBg?: string;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  selected,
  onPress,
  activeColor = Colors.primary,
  activeBg = Colors.primaryLight,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        selected
          ? {
              borderColor: activeColor,
              backgroundColor: activeBg,
            }
          : {
              borderColor: Colors.streakEmpty,
              backgroundColor: 'transparent',
            },
      ]}
    >
      <Text
        style={[
          styles.text,
          selected
            ? {
                color: activeColor,
                fontFamily: Fonts.sansMedium,
              }
            : {
                color: Colors.textMuted,
                fontFamily: Fonts.sans,
              },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  text: {
    fontSize: FontSizes.base,
  },
});
