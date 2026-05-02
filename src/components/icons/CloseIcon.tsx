import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const CloseIcon: React.FC<Props> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export default CloseIcon;
