import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const PersonIcon: React.FC<Props> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={8} r={3.5} />
    <Path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </Svg>
);

export default PersonIcon;
