/**
 * Responsive Design System Utilities
 * Includes hooks and utilities for responsive layouts
 */

import { useWindowDimensions, Platform } from 'react-native';
import { Breakpoints, Spacing } from '../theme';

// ─── Window Dimensions Hook ────────────────────────────────
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isSmallPhone: width < 380,
    isPhone: width < 600,
    isTablet: width >= 600,
    isLandscape: width > height,
    isPortrait: height > width,
    isSmall: width < Breakpoints.sm,
    isSmallScreen: width >= Breakpoints.sm && width < Breakpoints.md,
    isMedium: width >= Breakpoints.md && width < Breakpoints.lg,
    isLarge: width >= Breakpoints.lg,
    isExtraLarge: width >= Breakpoints.xl,
  };
};

// ─── Responsive Values Hook ────────────────────────────────
interface ResponsiveValue {
  small?: any;
  medium?: any;
  large?: any;
  default: any;
}

export const useResponsiveValue = (values: ResponsiveValue): any => {
  const { width } = useWindowDimensions();

  if (width < Breakpoints.sm && values.small !== undefined) return values.small;
  if (
    width >= Breakpoints.sm &&
    width < Breakpoints.md &&
    values.medium !== undefined
  ) {
    return values.medium;
  }
  if (width >= Breakpoints.md && values.large !== undefined) return values.large;

  return values.default;
};

// ─── Responsive Spacing ────────────────────────────────────
export const useResponsiveSpacing = (): typeof Spacing => {
  const { isSmallPhone } = useResponsive();

  if (isSmallPhone) {
    return {
      0: 0,
      xs: 2,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 20,
      '3xl': 24,
      '4xl': 32,
      '5xl': 40,
    } as typeof Spacing;
  }

  return Spacing;
};

// ─── Responsive Font Sizes ────────────────────────────────
export const useResponsiveFontSize = (baseFontSize: number): number => {
  const { isSmallPhone, isSmall } = useResponsive();

  if (isSmallPhone) {
    return Math.max(baseFontSize - 2, 10);
  }

  if (isSmall) {
    return Math.max(baseFontSize - 1, 11);
  }

  return baseFontSize;
};

// ─── Responsive Component Props ────────────────────────────
export const getResponsiveStyle = (
  responsive: boolean,
  screenWidth: number,
) => {
  if (!responsive) return {};

  if (screenWidth < 380) {
    return {
      paddingHorizontal: Spacing.sm,
      marginHorizontal: Spacing.xs,
    };
  }

  if (screenWidth < 600) {
    return {
      paddingHorizontal: Spacing.md,
      marginHorizontal: Spacing.sm,
    };
  }

  return {
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.md,
  };
};

// ─── Grid System ───────────────────────────────────────────
export const getGridColumns = (screenWidth: number, minColumnWidth: number = 150) => {
  const availableWidth = screenWidth - Spacing.md * 2;
  return Math.floor(availableWidth / minColumnWidth);
};

// ─── Safe Area Insets ──────────────────────────────────────
export const useStatusBarHeight = () => {
  const isIOS = Platform.OS === 'ios';
  return isIOS ? 44 : 0;
};

export const useNavBarHeight = () => {
  const { isSmallPhone } = useResponsive();
  return isSmallPhone ? 56 : 64;
};

export const useSafeAreaInsets = () => {
  const statusBarHeight = useStatusBarHeight();

  return {
    top: statusBarHeight,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// ─── Aspect Ratio Calculator ───────────────────────────────
export const calculateDimensions = (
  containerWidth: number,
  aspectRatio: number = 16 / 9,
) => {
  const height = containerWidth / aspectRatio;
  return { width: containerWidth, height };
};

// ─── Platform-specific Values ──────────────────────────────
export const useResponsiveFlex = () => {
  const { isTablet } = useResponsive();

  return {
    mainContent: isTablet ? 0.7 : 1,
    sidebar: isTablet ? 0.3 : undefined,
  };
};

// ─── Image Size Calculator ────────────────────────────────
export const getResponsiveImageSize = (
  screenWidth: number,
  columns: number = 3,
  gap: number = Spacing.md,
) => {
  const totalGaps = (columns - 1) * gap;
  const totalPadding = Spacing.md * 2;
  const availableWidth = screenWidth - totalPadding - totalGaps;
  return availableWidth / columns;
};

// ─── Pagination Sizing ────────────────────────────────────
export const getResponsivePageSize = () => {
  const { isSmallPhone, isSmallScreen } = useResponsive();

  if (isSmallPhone) return 8;
  if (isSmallScreen) return 12;
  return 16;
};

// ─── Container Max Width ──────────────────────────────────
export const useResponsiveMaxWidth = () => {
  const { isTablet } = useResponsive();

  return isTablet ? 1024 : undefined;
};

// ─── Column Width Distribution ────────────────────────────
export const distributeColumns = (
  totalWidth: number,
  columnCount: number,
  gapSize: number = Spacing.md,
) => {
  const totalGaps = (columnCount - 1) * gapSize;
  const availableWidth = totalWidth - totalGaps;
  return availableWidth / columnCount;
};

export default {
  useResponsive,
  useResponsiveValue,
  useResponsiveSpacing,
  useResponsiveFontSize,
  getResponsiveStyle,
  getGridColumns,
  useStatusBarHeight,
  useNavBarHeight,
  useSafeAreaInsets,
  calculateDimensions,
  useResponsiveFlex,
  getResponsiveImageSize,
  getResponsivePageSize,
  useResponsiveMaxWidth,
  distributeColumns,
};
