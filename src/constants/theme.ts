/**
 * App-wide theme tokens. Colors are defined for light + dark.
 * Naming follows: background / backgroundElement / backgroundSelected / text / textSecondary
 */

import '@/global.css';

import { Platform, useColorScheme } from 'react-native';

/* -------------------------------------------------------------------------- */
/*                                   Colors                                   */
/* -------------------------------------------------------------------------- */

export const Colors = {
  light: {
    text: '#0B0B0F',
    textSecondary: '#60646C',
    background: '#F8F9FE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFECFF',
    border: '#EDF1F7',

    // Brand
    primary: '#6C5CE7',
    primaryLight: '#A29BFE',
    primarySoft: '#EFECFF',

    // Money
    income: '#00B894',
    incomeSoft: '#E5F7F1',
    expense: '#FF7675',
    expenseSoft: '#FFECEC',

    // Feedback
    warning: '#FDCB6E',
    warningSoft: '#FFF7E0',
    danger: '#E17055',

    overlay: 'rgba(0,0,0,0.4)',
    white: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B0B4BA',
    background: '#0B0B0F',
    backgroundElement: '#15161A',
    backgroundSelected: '#212225',
    border: '#2E3135',

    primary: '#8B7CF6',
    primaryLight: '#A29BFE',
    primarySoft: '#2A2545',

    income: '#22D3A7',
    incomeSoft: '#12251F',
    expense: '#FF8B8B',
    expenseSoft: '#2C1A1A',

    warning: '#FDCB6E',
    warningSoft: '#2C2718',
    danger: '#E17055',

    overlay: 'rgba(0,0,0,0.6)',
    white: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)['light'];

/* -------------------------------------------------------------------------- */
/*                                   Fonts                                    */
/* -------------------------------------------------------------------------- */

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 20,
  xxl: 26,
  display: 34,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/* -------------------------------------------------------------------------- */
/*                             Spacing / Radius                               */
/* -------------------------------------------------------------------------- */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 30,
  xxl: 34,
} as const;

/* -------------------------------------------------------------------------- */
/*                                   Shadows                                  */
/* -------------------------------------------------------------------------- */

export const Shadow = {
  card: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// Lowercase alias if you prefer `shadow.card`
export const shadow = Shadow;

/* -------------------------------------------------------------------------- */
/*                                 Layout                                     */
/* -------------------------------------------------------------------------- */

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/* -------------------------------------------------------------------------- */
/*                                  Hook                                      */
/* -------------------------------------------------------------------------- */

/**
 * Access theme tokens based on the device color scheme.
 *
 *   const { colors, isDark } = useTheme();
 */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
  };
}