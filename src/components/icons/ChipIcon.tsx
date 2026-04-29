import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface Props {
  size?: number;
  color?: string;
}

export const ChipIcon: React.FC<Props> = ({ size = 16, color = Colors.textMuted }) => {
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
      <Rect x="7" y="7" width="10" height="10" rx="1" />
      <Line x1="9" y1="7" x2="9" y2="4" />
      <Line x1="12" y1="7" x2="12" y2="4" />
      <Line x1="15" y1="7" x2="15" y2="4" />
      <Line x1="9" y1="20" x2="9" y2="17" />
      <Line x1="12" y1="20" x2="12" y2="17" />
      <Line x1="15" y1="20" x2="15" y2="17" />
      <Line x1="7" y1="9" x2="4" y2="9" />
      <Line x1="7" y1="12" x2="4" y2="12" />
      <Line x1="7" y1="15" x2="4" y2="15" />
      <Line x1="20" y1="9" x2="17" y2="9" />
      <Line x1="20" y1="12" x2="17" y2="12" />
      <Line x1="20" y1="15" x2="17" y2="15" />
    </Svg>
  );
};
