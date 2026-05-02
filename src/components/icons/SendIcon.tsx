import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; }

const SendIcon: React.FC<Props> = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12l16-8-5 17-3-7-8-2z" />
  </Svg>
);

export default SendIcon;
