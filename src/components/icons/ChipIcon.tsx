import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const ChipIcon: React.FC<Props> = ({ size = 22, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
    <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </Svg>
);

export default ChipIcon;
