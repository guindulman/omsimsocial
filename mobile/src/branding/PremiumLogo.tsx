import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Line, Stop } from 'react-native-svg';

import { brandTokens } from '../theme/tokens';

type LogoProps = {
  size?: number;
};

export const PremiumLogo = ({ size = 140 }: LogoProps) => {
  const center = 60;
  const radius = 32;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="premiumGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brandTokens.accent} />
          <Stop offset="1" stopColor={brandTokens.accentAlt} />
        </LinearGradient>
      </Defs>
      <Circle cx={center} cy={center} r="44" fill="url(#premiumGradient)" opacity="0.15" />
      <Circle cx={center} cy={center} r={radius} stroke="url(#premiumGradient)" strokeWidth="8" fill="none" />
      <Line x1={center} y1={center - 12} x2={center} y2={center + 12} stroke="url(#premiumGradient)" strokeWidth="8" strokeLinecap="round" />
      <Line x1={center - 12} y1={center} x2={center + 12} y2={center} stroke="url(#premiumGradient)" strokeWidth="8" strokeLinecap="round" />
    </Svg>
  );
};
