import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; filled?: boolean; }

const TabHomeIcon: React.FC<Props> = ({ size = 22, color = 'currentColor', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z" />
  </Svg>
);

export default TabHomeIcon;
