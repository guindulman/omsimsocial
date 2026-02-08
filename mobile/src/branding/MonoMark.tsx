import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

import { brandTokens } from '../theme/tokens';

type MarkProps = {
  size?: number;
  color?: string;
};

export const MonoMark = ({ size = 48, color = brandTokens.accent }: MarkProps) => {
  const center = 32;
  const radius = 14;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={center} cy={center} r={radius} stroke={color} strokeWidth="4" fill="none" />
      <Line x1={center} y1={center - 8} x2={center} y2={center + 8} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <Line x1={center - 8} y1={center} x2={center + 8} y2={center} stroke={color} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
};
