/**
 * İTEO Mobil tasarım token'ları.
 * Marka renkleri korunur; aralık, köşe, gölge ve tipografi ölçekleri burada toplanır.
 */
import type { TextStyle, ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  display: 28,
  hero: 34,
} as const;

export const fontWeight = {
  medium: '600',
  semibold: '700',
  bold: '800',
  black: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const shadow = {
  card: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  floating: {
    shadowColor: '#0A0A0A',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

/** Sabit tab bar yüksekliği + alt boşluk; içerik bunun arkasında kalmasın diye. */
export const TAB_BAR_HEIGHT = 72;
export const SCREEN_BOTTOM_INSET = TAB_BAR_HEIGHT + 36;
