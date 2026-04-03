/**
 * Layout Components
 * Provides spacing, alignment, and structural components
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Spacing } from '../theme';

// ─── Stack Component (Flexbox wrapper) ──────────────────────
interface StackProps extends ViewProps {
  /** Direction of stack */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Horizontal alignment */
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  /** Vertical alignment */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  /** Gap between items */
  gap?: keyof typeof Spacing | number;
  /** Padding */
  p?: keyof typeof Spacing | number;
  /** Padding horizontal */
  px?: keyof typeof Spacing | number;
  /** Padding vertical */
  py?: keyof typeof Spacing | number;
  /** Flex value */
  flex?: number;
  /** Width */
  w?: string | number;
  /** Height */
  h?: string | number;
}

export const Stack = React.forwardRef<View, StackProps>(
  (
    {
      direction = 'column',
      align = 'flex-start',
      justify = 'flex-start',
      gap,
      p,
      px,
      py,
      flex,
      w,
      h,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const getSpacing = (val?: keyof typeof Spacing | number) => {
      if (val === undefined) return undefined;
      if (typeof val === 'number') return val;
      return Spacing[val];
    };

    const stackStyle: ViewProps['style'] = [
      {
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap: getSpacing(gap),
        padding: getSpacing(p),
        paddingHorizontal: getSpacing(px),
        paddingVertical: getSpacing(py),
        flex,
        width: w,
        height: h,
      },
      style,
    ];

    return (
      <View ref={ref} style={stackStyle} {...props}>
        {children}
      </View>
    );
  },
);

Stack.displayName = 'Stack';

// ─── Row Component ─────────────────────────────────────────
interface RowProps extends Omit<StackProps, 'direction'> {}

export const Row = React.forwardRef<View, RowProps>((props, ref) => (
  <Stack ref={ref} direction="row" {...props} />
));

Row.displayName = 'Row';

// ─── Column Component ──────────────────────────────────────
interface ColumnProps extends Omit<StackProps, 'direction'> {}

export const Column = React.forwardRef<View, ColumnProps>((props, ref) => (
  <Stack ref={ref} direction="column" {...props} />
));

Column.displayName = 'Column';

// ─── Center Component ──────────────────────────────────────
interface CenterProps extends Omit<StackProps, 'align' | 'justify'> {}

export const Center = React.forwardRef<View, CenterProps>((props, ref) => (
  <Stack ref={ref} align="center" justify="center" {...props} />
));

Center.displayName = 'Center';

// ─── Container Component ───────────────────────────────────
interface ContainerProps extends ViewProps {
  /** Padding preset: sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Background color */
  bg?: string;
  /** Is horizontal scrollable */
  scroll?: boolean;
}

export const Container = React.forwardRef<View, ContainerProps>(
  ({ size = 'md', bg, style, children, ...props }, ref) => {
    const paddingPresets = {
      sm: Spacing.sm,
      md: Spacing.md,
      lg: Spacing.lg,
    };

    return (
      <View
        ref={ref}
        style={[
          {
            paddingHorizontal: paddingPresets[size],
            paddingVertical: paddingPresets[size],
            backgroundColor: bg,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);

Container.displayName = 'Container';

// ─── Spacer Component ──────────────────────────────────────
interface SpacerProps extends ViewProps {
  /** Space size */
  size?: keyof typeof Spacing | number;
  /** Direction */
  direction?: 'horizontal' | 'vertical';
}

export const Spacer = React.forwardRef<View, SpacerProps>(
  ({ size = 'md', direction = 'vertical', style, ...props }, ref) => {
    const getSpacing = (val: keyof typeof Spacing | number) => {
      if (typeof val === 'number') return val;
      return Spacing[val];
    };

    const space = getSpacing(size);

    return (
      <View
        ref={ref}
        style={[
          {
            width: direction === 'horizontal' ? space : undefined,
            height: direction === 'vertical' ? space : undefined,
          },
          style,
        ]}
        {...props}
      />
    );
  },
);

Spacer.displayName = 'Spacer';

// ─── Safe Area Container ───────────────────────────────────
interface SafeViewProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeView = React.forwardRef<View, SafeViewProps>(
  ({ edges = ['top', 'bottom'], style, children, ...props }, ref) => {
    // Simple implementation - adjust top/bottom padding based on edges
    const paddingTop = edges.includes('top') ? 44 : 0;
    const paddingBottom = edges.includes('bottom') ? 34 : 0;

    return (
      <View
        ref={ref}
        style={[
          {
            paddingTop,
            paddingBottom,
            flex: 1,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);

SafeView.displayName = 'SafeView';

// ─── Divider Component ─────────────────────────────────────
interface DividerProps extends ViewProps {
  /** Divider color */
  color?: string;
  /** Thickness */
  thickness?: number;
  /** Margin vertical */
  my?: keyof typeof Spacing | number;
  /** Margin horizontal */
  mx?: keyof typeof Spacing | number;
}

export const Divider = React.forwardRef<View, DividerProps>(
  ({ color = '#e5e7eb', thickness = 1, my, mx, style, ...props }, ref) => {
    const getSpacing = (val?: keyof typeof Spacing | number) => {
      if (val === undefined) return undefined;
      if (typeof val === 'number') return val;
      return Spacing[val];
    };

    return (
      <View
        ref={ref}
        style={[
          {
            height: thickness,
            backgroundColor: color,
            marginVertical: getSpacing(my),
            marginHorizontal: getSpacing(mx),
          },
          style,
        ]}
        {...props}
      />
    );
  },
);

Divider.displayName = 'Divider';

// ─── Inset Component ───────────────────────────────────────
interface InsetProps extends ViewProps {
  /** All sides */
  all?: keyof typeof Spacing | number;
  /** Horizontal */
  x?: keyof typeof Spacing | number;
  /** Vertical */
  y?: keyof typeof Spacing | number;
  /** Top */
  top?: keyof typeof Spacing | number;
  /** Bottom */
  bottom?: keyof typeof Spacing | number;
  /** Left */
  left?: keyof typeof Spacing | number;
  /** Right */
  right?: keyof typeof Spacing | number;
}

export const Inset = React.forwardRef<View, InsetProps>(
  ({ all, x, y, top, bottom, left, right, style, children, ...props }, ref) => {
    const getSpacing = (val?: keyof typeof Spacing | number) => {
      if (val === undefined) return undefined;
      if (typeof val === 'number') return val;
      return Spacing[val];
    };

    const allVal = getSpacing(all);
    const xVal = getSpacing(x);
    const yVal = getSpacing(y);

    return (
      <View
        ref={ref}
        style={[
          {
            margin: allVal,
            marginHorizontal: xVal ?? allVal,
            marginVertical: yVal ?? allVal,
            marginTop: getSpacing(top),
            marginBottom: getSpacing(bottom),
            marginLeft: getSpacing(left),
            marginRight: getSpacing(right),
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);

Inset.displayName = 'Inset';

export default {
  Stack,
  Row,
  Column,
  Center,
  Container,
  Spacer,
  SafeView,
  Divider,
  Inset,
};
