export const colors = {
  background: '#F8F6F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EDE6',
  border: '#D9D2C5',
  text: '#1F2933',
  textMuted: '#5B6470',
  primary: '#2F5D3A',
  primaryHover: '#244A2E',
  danger: '#B42318',
  dangerMuted: '#FDECEC',
  warning: '#B7791F',
  warningMuted: '#FFF6E5',
  success: '#2F855A',
  successMuted: '#E6F4EC',
  cancelled: '#9AA3AE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export const horseUtilizationColors = {
  low: colors.success,
  medium: colors.warning,
  high: colors.danger,
} as const;

export function getHorseUtilizationColor(percentage: number): string {
  if (percentage < 50) return horseUtilizationColors.low;
  if (percentage <= 80) return horseUtilizationColors.medium;
  return horseUtilizationColors.high;
}
