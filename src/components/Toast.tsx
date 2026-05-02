import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrainIcon from './icons/BrainIcon';
import ChipIcon from './icons/ChipIcon';
import { Colors, Fonts, FontSizes } from '../constants/theme';

interface ToastProps {
  visible: boolean;
  type: 'win' | 'sin';
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, type, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const { top: safeTop } = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, onHide]);

  if (!visible) return null;

  const isWin = type === 'win';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: isWin ? Colors.primary : Colors.amber,
          top: safeTop + 16,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        {isWin ? (
          <BrainIcon size={12} color={Colors.white} />
        ) : (
          <ChipIcon size={12} color={Colors.white} />
        )}
        <Text style={styles.text}>{isWin ? 'Win logged' : 'Logged'}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.sansMedium,
  },
});
