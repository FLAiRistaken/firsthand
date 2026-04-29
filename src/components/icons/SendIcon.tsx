import React from 'react';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface Props {
  size?: number;
  color?: string;
}

export const SendIcon: React.FC<Props> = ({ size = 15, color = Colors.white }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="22" y1="2" x2="11" y2="13" />
      <Polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  );
};
