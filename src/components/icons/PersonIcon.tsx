import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface Props {
  size?: number;
  color?: string;
}

export const PersonIcon: React.FC<Props> = ({ size = 17, color = Colors.textMuted }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  );
};
