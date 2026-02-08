import type { EdgeInsets } from 'react-native-safe-area-context';

type TabTheme = {
  colors: {
    borderSubtle: string;
    surface: string;
  };
};

const TAB_BAR_BASE_HEIGHT = 52;

export const buildTabBarStyle = (theme: TabTheme, insets: EdgeInsets) => ({
  height: TAB_BAR_BASE_HEIGHT + insets.bottom,
  paddingTop: 4,
  paddingBottom: 6 + insets.bottom,
  borderTopWidth: 1,
  borderTopColor: theme.colors.borderSubtle,
  backgroundColor: theme.colors.surface,
});
