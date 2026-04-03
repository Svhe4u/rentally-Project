/**
 * Centralized Theme System for Rentally
 * Includes colors, typography, spacing, shadows, and responsive units
 */

// ─── Color Palette ──────────────────────────────────────────
export const Colors = {
  // Brand colors
  primary: '#2e55fa',
  secondary: '#6366f1',
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  
  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Text colors
  text: {
    primary: '#111111',
    secondary: '#666666',
    tertiary: '#999999',
    light: '#cccccc',
    disabled: '#aaaaaa',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f4f5f7',
    tertiary: '#f0f1f3',
    dark: '#0f172a',
  },
  
  // Legacy colors for compatibility
  kakao: '#FEE500',
  facebook: '#1877F2',
  red: '#ff3b5c',
  yellow: '#f0ad00',
  
  // Utilities
  border: '#e8e8ec',
  divider: '#e5e7eb',
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.4)',
} as const;

// ─── Typography System ──────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  sizes: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  
  // Pre-composed text styles
  styles: {
    // Headings
    h1: {
      fontSize: 32,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 26,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    
    // Body text
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 20,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 18,
    },
    
    // Labels & captions
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      lineHeight: 15,
    },
    captionSmall: {
      fontSize: 10,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      lineHeight: 14,
    },
  },
} as const;

// ─── Spacing System ────────────────────────────────────────
export const Spacing = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ─── Border Radius System ───────────────────────────────────
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Shadow System ──────────────────────────────────────────
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ─── Animation Durations ────────────────────────────────────
export const Animation = {
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
  slowest: 800,
} as const;

// ─── Responsive Breakpoints ────────────────────────────────
export const Breakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// ─── Layout Dimensions ─────────────────────────────────────
export const Layout = {
  safeArea: {
    top: 44, // default for iPhone
    bottom: 34, // default for iPhone with notch
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  headerHeight: 56,
  bottomNavHeight: 64,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSmall: 40,
  touchMinSize: 44,
} as const;

// ─── Z-Index Scale ─────────────────────────────────────────
export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 50,
  modal: 100,
  popover: 110,
  tooltip: 120,
  notification: 1000,
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  Breakpoints,
  Layout,
  ZIndex,
};
