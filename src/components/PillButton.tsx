import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius, Spacing, BorderWidths } from '../constants/theme';

type Variant = 'primary' | 'amber';

export interface PillButtonProps {
  onLongPress?: () => void;
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: Variant;
}

export const PillButton = React.memo(({
  label,
  selected,
  onPress,
  onLongPress,
  variant = 'primary',
}: PillButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.animatedContainer, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          selected
            ? variant === 'amber'
              ? styles.buttonSelectedAmber
              : styles.buttonSelectedPrimary
            : styles.buttonUnselected,
        ]}
      >
        <Text
          style={[
            styles.text,
            selected
              ? variant === 'amber'
                ? styles.textSelectedAmber
                : styles.textSelectedPrimary
              : styles.textUnselected,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  animatedContainer: {
    // Wrapper for spring scale animation; layout driven by Pressable child
  },
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: BorderWidths.md,
  },
  buttonUnselected: {
    borderColor: Colors.streakEmpty,
    backgroundColor: 'transparent',
  },
  buttonSelectedPrimary: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  buttonSelectedAmber: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  text: {
    fontSize: FontSizes.base,
  },
  textUnselected: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
  },
  textSelectedPrimary: {
    color: Colors.primary,
    fontFamily: Fonts.sansMedium,
  },
  textSelectedAmber: {
    color: Colors.amber,
    fontFamily: Fonts.sansMedium,
  },
});
