import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export const BrainIcon: React.FC<Props> = ({ size = 16, color = 'white' }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 5C10.5 3.5 8 3.5 6.5 5S4 8.5 5 10.5C3.5 11 3 12.5 3.5 14S5.5 16 7 15.5C7.5 17.5 9.5 19 12 19s4.5-1.5 5-3.5c1.5.5 3.5-.5 3.5-2s-.5-3-2-3.5c1-2 .5-4.5-1.5-5.5S13.5 3.5 12 5z" />
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="7" y1="10" x2="12" y2="12" />
      <Line x1="17" y1="10" x2="12" y2="12" />
    </Svg>
  );
};
