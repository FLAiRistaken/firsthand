import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Icons, BorderWidths } from '../../constants/theme';

interface Props { size?: number; color?: string; filled?: boolean; }

const TabHistoryIcon: React.FC<Props> = ({ size = Icons.defaultSize, color = Icons.defaultColor, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color} strokeWidth={BorderWidths.sm} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M3 12h18M3 18h12" />
  </Svg>
);

export default TabHistoryIcon;
