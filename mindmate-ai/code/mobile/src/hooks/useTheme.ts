import { useColorScheme } from 'react-native';
import { useUserStore } from '@stores/userStore';
import { COLORS } from '@constants';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  placeholder: string;
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
}

interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

export const useTheme = (): Theme => {
  const systemColorScheme = useColorScheme();
  const { preferences } = useUserStore();

  // Determine theme based on user preference or system
  const themePreference = preferences?.theme || 'system';
  const isDark =
    themePreference === 'system'
      ? systemColorScheme === 'dark'
      : themePreference === 'dark';

  const colors: ThemeColors = isDark
    ? {
        // Dark theme colors
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        primaryDark: COLORS.primaryDark,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.error,
        info: COLORS.info,
        background: COLORS.darkBackground,
        surface: COLORS.darkSurface,
        card: COLORS.darkCard,
        text: COLORS.white,
        textSecondary: COLORS.gray300,
        textMuted: COLORS.gray500,
        border: COLORS.gray700,
        divider: COLORS.gray800,
        placeholder: COLORS.gray500,
        white: COLORS.white,
        black: COLORS.black,
        gray50: COLORS.gray900,
        gray100: COLORS.gray800,
        gray200: COLORS.gray700,
        gray300: COLORS.gray600,
        gray400: COLORS.gray500,
        gray500: COLORS.gray400,
        gray600: COLORS.gray300,
        gray700: COLORS.gray200,
        gray800: COLORS.gray100,
        gray900: COLORS.gray50,
      }
    : {
        // Light theme colors
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        primaryDark: COLORS.primaryDark,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.error,
        info: COLORS.info,
        background: COLORS.gray50,
        surface: COLORS.white,
        card: COLORS.white,
        text: COLORS.gray900,
        textSecondary: COLORS.gray600,
        textMuted: COLORS.gray500,
        border: COLORS.gray200,
        divider: COLORS.gray200,
        placeholder: COLORS.gray400,
        white: COLORS.white,
        black: COLORS.black,
        gray50: COLORS.gray50,
        gray100: COLORS.gray100,
        gray200: COLORS.gray200,
        gray300: COLORS.gray300,
        gray400: COLORS.gray400,
        gray500: COLORS.gray500,
        gray600: COLORS.gray600,
        gray700: COLORS.gray700,
        gray800: COLORS.gray800,
        gray900: COLORS.gray900,
      };

  return { isDark, colors };
};
