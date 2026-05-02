import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const BrainIcon: React.FC<Props> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 11V5.5a1.5 1.5 0 013 0V11" />
    <Path d="M12 11V4a1.5 1.5 0 013 0v7" />
    <Path d="M15 11V5.5a1.5 1.5 0 013 0V13" />
    <Path d="M9 11V8a1.5 1.5 0 00-3 0v8c0 3 2.5 5 5.5 5h2c3 0 5.5-2 5.5-5v-3" />
  </Svg>
);

export default BrainIcon;
