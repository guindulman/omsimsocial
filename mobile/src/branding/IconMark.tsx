import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

import { brandTokens } from '../theme/tokens';

type MarkProps = {
  size?: number;
};

export const IconMark = ({ size = 64 }: MarkProps) => {
  const center = 32;
  const radius = 18;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={brandTokens.accent}
        strokeWidth="4"
        fill="none"
      />
      <Line x1={center} y1={center - 8} x2={center} y2={center + 8} stroke={brandTokens.accent} strokeWidth="4" strokeLinecap="round" />
      <Line x1={center - 8} y1={center} x2={center + 8} y2={center} stroke={brandTokens.accent} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
};
