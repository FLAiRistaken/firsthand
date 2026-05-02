import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; filled?: boolean; }

const TabCoachIcon: React.FC<Props> = ({ size = 22, color = 'currentColor', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6h16a1 1 0 011 1v9a1 1 0 01-1 1h-9l-4 3v-3H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
  </Svg>
);

export default TabCoachIcon;
