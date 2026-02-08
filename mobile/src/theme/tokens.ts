import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'dark' | 'light';
export type AccentChoice = 'cyan' | 'sky' | 'violet';

const brand = {
  midnight: '#0B0F1A',
  trueBlack: '#000000',
  primary: '#2F6BFF',
  secondary: '#FF7A59',
  mint: '#17B897',
  urgency: '#E11D48',
  textPrimary: '#101828',
  textSecondary: '#475569',
};

const lightPalette = {
  background: '#F5F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2FF',
  surfaceGlass: 'rgba(255, 255, 255, 0.9)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.98)',
  textPrimary: brand.textPrimary,
  textSecondary: brand.textSecondary,
  borderSubtle: 'rgba(15, 23, 42, 0.08)',
  borderStrong: 'rgba(15, 23, 42, 0.16)',
  shadow: 'rgba(15, 23, 42, 0.12)',
  overlay: 'rgba(15, 23, 42, 0.35)',
};

const darkPalette = {
  background: '#0D1321',
  surface: '#151C2F',
  surfaceAlt: '#101829',
  surfaceGlass: 'rgba(21, 28, 47, 0.9)',
  surfaceGlassStrong: 'rgba(21, 28, 47, 0.98)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderSubtle: 'rgba(248, 250, 252, 0.08)',
  borderStrong: 'rgba(248, 250, 252, 0.16)',
  shadow: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(3, 7, 18, 0.7)',
};

const oledPalette = {
  background: brand.trueBlack,
  surface: '#0D1321',
  surfaceAlt: '#101829',
  surfaceGlass: 'rgba(13, 19, 33, 0.9)',
  surfaceGlassStrong: 'rgba(13, 19, 33, 0.98)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderSubtle: 'rgba(248, 250, 252, 0.08)',
  borderStrong: 'rgba(248, 250, 252, 0.16)',
  shadow: 'rgba(0, 0, 0, 0.7)',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const radii = {
  card: 20,
  pill: 999,
  sm: 12,
  md: 16,
};

const typography = {
  fontFamily: Platform.select({
    ios: 'Poppins_400Regular',
    android: 'Poppins_400Regular',
    default: 'Poppins_400Regular',
  }),
  fonts: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  display: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
};

const baseGradients = {
  accent: [brand.primary, brand.secondary],
  subtle: ['rgba(47, 107, 255, 0.18)', 'rgba(255, 122, 89, 0.12)'],
  coverPresets: [
    ['#111827', '#1F2937', '#374151'],
    ['#102A43', '#1F4E79', '#2F6BFF'],
    ['#3F1D2A', '#5C2B3B', '#FF7A59'],
    ['#0F2F2C', '#0B5C51', '#17B897'],
  ],
};

export type Theme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceGlass: string;
    surfaceGlassStrong: string;
    textPrimary: string;
    textSecondary: string;
    borderSubtle: string;
    borderStrong: string;
    accent: string;
    accentSoft: string;
    accentGlow: string;
    accentSecondary: string;
    urgency: string;
    overlay: string;
    shadow: string;
    success: string;
    glassBorder: string;
    chipNeutral: string;
    chipNeutralText: string;
    chipUrgency: string;
    chipUrgencyText: string;
    transparent: string;
  };
  gradients: typeof baseGradients;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

export const createTheme = (
  mode: 'dark' | 'light',
  oled: boolean,
  accentChoice: AccentChoice
): Theme => {
  const palette = mode === 'dark' ? (oled ? oledPalette : darkPalette) : lightPalette;
  const accent =
    accentChoice === 'violet'
      ? brand.mint
      : accentChoice === 'sky'
      ? brand.secondary
      : brand.primary;
  const accentSecondary =
    accentChoice === 'violet'
      ? brand.secondary
      : accentChoice === 'sky'
      ? brand.mint
      : brand.secondary;
  const accentSoft =
    accentChoice === 'violet'
      ? mode === 'dark'
        ? 'rgba(23, 184, 151, 0.22)'
        : 'rgba(23, 184, 151, 0.14)'
      : accentChoice === 'sky'
      ? mode === 'dark'
        ? 'rgba(255, 122, 89, 0.22)'
        : 'rgba(255, 122, 89, 0.14)'
      : mode === 'dark'
      ? 'rgba(47, 107, 255, 0.2)'
      : 'rgba(47, 107, 255, 0.14)';
  const accentGlow =
    accentChoice === 'violet'
      ? mode === 'dark'
        ? 'rgba(23, 184, 151, 0.4)'
        : 'rgba(23, 184, 151, 0.3)'
      : accentChoice === 'sky'
      ? mode === 'dark'
        ? 'rgba(255, 122, 89, 0.4)'
        : 'rgba(255, 122, 89, 0.3)'
      : mode === 'dark'
      ? 'rgba(47, 107, 255, 0.4)'
      : 'rgba(47, 107, 255, 0.28)';
  const glassBorder = mode === 'dark' ? 'rgba(248, 250, 252, 0.12)' : 'rgba(15, 23, 42, 0.1)';

  const gradients = {
    ...baseGradients,
    accent:
      accentChoice === 'violet'
        ? [brand.mint, brand.secondary]
        : accentChoice === 'sky'
        ? [brand.secondary, brand.primary]
        : [brand.primary, brand.secondary],
  };

  return {
    isDark: mode === 'dark',
    colors: {
      background: palette.background,
      surface: palette.surface,
      surfaceAlt: palette.surfaceAlt,
      surfaceGlass: palette.surfaceGlass,
      surfaceGlassStrong: palette.surfaceGlassStrong,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderSubtle: palette.borderSubtle,
      borderStrong: palette.borderStrong,
      accent,
      accentSoft,
      accentGlow,
      accentSecondary,
      urgency: brand.urgency,
      overlay: palette.overlay,
      shadow: palette.shadow,
      success: brand.mint,
      glassBorder,
      chipNeutral: mode === 'dark' ? 'rgba(234, 240, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
      chipNeutralText: palette.textSecondary,
      chipUrgency: mode === 'dark' ? 'rgba(255, 77, 109, 0.2)' : 'rgba(255, 77, 109, 0.16)',
      chipUrgencyText: brand.urgency,
      transparent: 'transparent',
    },
    gradients,
    spacing,
    radii,
    typography,
  };
};

export const brandTokens = brand;
