import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '../constants/theme';

type Variant = 'primary' | 'amber';

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: Variant;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  selected,
  onPress,
  variant = 'primary',
}) => {
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
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
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
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
