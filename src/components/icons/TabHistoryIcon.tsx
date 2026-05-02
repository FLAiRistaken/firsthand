import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const TabHistoryIcon: React.FC<Props> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M3 12h18M3 18h12" />
  </Svg>
);

export default TabHistoryIcon;
