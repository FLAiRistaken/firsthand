import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; direction?: 'right' | 'left' | 'up' | 'down'; }

const ArrowIcon: React.FC<Props> = ({ size = 14, color = 'currentColor', direction = 'right' }) => {
  const rotation = { right: '0', down: '90', left: '180', up: '270' }[direction];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
};

export default ArrowIcon;
