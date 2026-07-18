export const colors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEE7',
  border: '#E4DFD4',
  borderStrong: '#D2CBBB',
  text: '#1D2A24',
  textMuted: '#6B7280',
  primary: '#2F5D3A',
  primaryHover: '#244A2E',
  primarySoft: '#E7EFE9',
  primaryContrast: '#FFFFFF',
  focusRing: 'rgba(47, 93, 58, 0.28)',
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

export const shadows = {
  xs: '0 1px 2px rgba(29, 42, 36, 0.06)',
  sm: '0 1px 3px rgba(29, 42, 36, 0.08), 0 1px 2px rgba(29, 42, 36, 0.04)',
  md: '0 6px 16px rgba(29, 42, 36, 0.08), 0 2px 4px rgba(29, 42, 36, 0.04)',
  lg: '0 16px 40px rgba(29, 42, 36, 0.12)',
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
