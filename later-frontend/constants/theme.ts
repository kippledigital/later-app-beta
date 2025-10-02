/**
 * Design system tokens for the Later App
 * Implements calm technology design principles with accessible color palettes
 */

import { Platform } from 'react-native';

export const Colors = {
  primary: {
    50: '#EBF5FF',
    100: '#C3E2FF',
    200: '#9BCFFF',
    300: '#73BCFF',
    400: '#4BA9FF',
    500: '#4A90E2', // Main brand blue
    600: '#3A73B8',
    700: '#2A568E',
    800: '#1A3964',
    900: '#0A1C3A',
  },
  secondary: {
    50: '#F4F9F4',
    100: '#E3F0E3',
    200: '#D2E7D2',
    300: '#C1DEC1',
    400: '#B0D5B0',
    500: '#8FBC8F', // Calm sage
    600: '#729672',
    700: '#557055',
    800: '#384A38',
    900: '#1B241B',
  },
  accent: {
    50: '#FEF6E7',
    100: '#FDE8B8',
    200: '#FCD989',
    300: '#FBCB5A',
    500: '#F7B731', // Warm energy
    600: '#C5922A',
    700: '#936D23',
    800: '#61481C',
    900: '#2F2315',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
  },
  // Legacy theme support
  light: {
    text: '#171717',
    background: '#FAFAFA',
    tint: '#4A90E2',
    icon: '#737373',
    tabIconDefault: '#737373',
    tabIconSelected: '#4A90E2',
  },
  dark: {
    text: '#F5F5F5',
    background: '#171717',
    tint: '#4BA9FF',
    icon: '#A3A3A3',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: '#4BA9FF',
  },
} as const;

export const Typography = {
  fontFamily: {
    inter: 'Inter',
    mono: 'JetBrains Mono',
  },
  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    'body-sm': 14,
    caption: 12,
  },
  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 28,
    h4: 24,
    body: 24,
    'body-sm': 20,
    caption: 16,
  },
  fontWeight: {
    h1: '700',
    h2: '600',
    h3: '600',
    h4: '600',
    body: '400',
    'body-sm': '400',
    caption: '400',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
} as const;

export const Animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    cinematic: 800,
  },
  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const ComponentSizes = {
  button: {
    height: {
      sm: 40,
      md: 48,
      lg: 56,
    },
    padding: {
      sm: { horizontal: 16, vertical: 8 },
      md: { horizontal: 24, vertical: 12 },
      lg: { horizontal: 32, vertical: 16 },
    },
  },
  input: {
    height: 48,
    padding: { horizontal: 16, vertical: 12 },
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
