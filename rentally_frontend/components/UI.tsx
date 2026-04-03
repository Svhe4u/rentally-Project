/**
 * Reusable UI Components Library
 * Includes Button, Card, Badge, Avatar, and more
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewProps,
  Image, ImageProps, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Animation, Layout } from '../theme';

// ─── Button Component ───────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button = ({
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
}: ButtonProps) => {
  const variants = {
    primary: {
      bg: Colors.primary,
      text: Colors.white,
      border: 'transparent',
    },
    secondary: {
      bg: Colors.gray[100],
      text: Colors.primary,
      border: 'transparent',
    },
    outline: {
      bg: Colors.white,
      text: Colors.primary,
      border: Colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: Colors.primary,
      border: 'transparent',
    },
    danger: {
      bg: Colors.danger,
      text: Colors.white,
      border: 'transparent',
    },
  };

  const sizes = {
    sm: {
      height: Layout.buttonHeightSmall,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.sizes.sm,
    },
    md: {
      height: Layout.buttonHeight,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.sizes.base,
    },
    lg: {
      height: 56,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.sizes.lg,
    },
  };

  const selectedVariant = variants[variant];
  const selectedSize = sizes[size];
  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    button: {
      height: selectedSize.height,
      paddingHorizontal: selectedSize.paddingHorizontal,
      backgroundColor: isDisabled ? Colors.gray[300] : selectedVariant.bg,
      borderColor: selectedVariant.border,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      width: fullWidth ? '100%' : undefined,
      ...Shadows.sm,
    },
    text: {
      fontSize: selectedSize.fontSize,
      fontWeight: '600',
      color: isDisabled ? Colors.gray[500] : selectedVariant.text,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={selectedVariant.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon as any} size={20} color={selectedVariant.text} />
          )}
          <Text style={styles.text}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon as any} size={20} color={selectedVariant.text} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Card Component ────────────────────────────────────────
interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, onPress, variant = 'elevated', style, ...props }, ref) => {
    const variantStyles = {
      elevated: {
        backgroundColor: Colors.background.primary,
        ...Shadows.md,
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: Colors.background.primary,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.none,
      },
      flat: {
        backgroundColor: Colors.background.secondary,
        borderWidth: 0,
        ...Shadows.none,
      },
    };

    const Wrapper = onPress ? TouchableOpacity : View;

    return (
      <Wrapper
        ref={ref as any}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          {
            borderRadius: BorderRadius.lg,
            overflow: 'hidden',
            ...variantStyles[variant],
          },
          style,
        ]}
        {...props}
      >
        {children}
      </Wrapper>
    );
  },
);

Card.displayName = 'Card';

// ─── Badge Component ───────────────────────────────────────
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface BadgeProps {
  children: string | number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export const Badge = ({ children, variant = 'primary', size = 'md', icon }: BadgeProps) => {
  const variantColors = {
    primary: { bg: Colors.primary, text: Colors.white },
    success: { bg: Colors.success, text: Colors.white },
    warning: { bg: Colors.warning, text: Colors.white },
    danger: { bg: Colors.danger, text: Colors.white },
    info: { bg: Colors.info, text: Colors.white },
    secondary: { bg: Colors.gray[100], text: Colors.gray[900] },
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
      fontSize: Typography.sizes.xs,
      borderRadius: BorderRadius.xs,
    },
    md: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: Typography.sizes.sm,
      borderRadius: BorderRadius.sm,
    },
    lg: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.sizes.base,
      borderRadius: BorderRadius.md,
    },
  };

  const colors = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: colors.bg,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      paddingVertical: sizeStyle.paddingVertical,
      borderRadius: sizeStyle.borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      alignSelf: 'flex-start',
    },
    text: {
      color: colors.text,
      fontSize: sizeStyle.fontSize,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.badge}>
      {icon && <Ionicons name={icon as any} size={12} color={colors.text} />}
      <Text style={styles.text}>{children}</Text>
    </View>
  );
};

// ─── Avatar Component ──────────────────────────────────────
interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  source?: any;
  initials?: string;
  name?: string;
  bgColor?: string;
}

export const Avatar = ({
  size = 'md',
  source,
  initials,
  name,
  bgColor = Colors.primary,
}: AvatarProps) => {
  const sizeMap = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 72,
  };

  const fontSize = {
    sm: Typography.sizes.sm,
    md: Typography.sizes.base,
    lg: Typography.sizes.lg,
    xl: Typography.sizes.xl,
  };

  const dimension = sizeMap[size];

  const styles = StyleSheet.create({
    avatar: {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    initials: {
      color: Colors.white,
      fontSize: fontSize[size],
      fontWeight: '700',
    },
  });

  if (source) {
    return (
      <Image
        source={source}
        style={styles.avatar}
      />
    );
  }

  const displayInitials = initials || name?.charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.avatar}>
      <Text style={styles.initials}>{displayInitials}</Text>
    </View>
  );
};

// ─── Chip Component ────────────────────────────────────────
interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
}

export const Chip = ({
  label,
  onPress,
  onClose,
  icon,
  selected = false,
  disabled = false,
  variant = 'filled',
}: ChipProps) => {
  const styles = StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: selected
        ? Colors.primary
        : variant === 'outline'
          ? Colors.white
          : Colors.gray[100],
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: Colors.border,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: selected ? Colors.white : Colors.text.primary,
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={selected ? Colors.white : Colors.text.primary}
        />
      )}
      <Text style={styles.text}>{label}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Ionicons
            name="close"
            size={16}
            color={selected ? Colors.white : Colors.text.primary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Tag Component ────────────────────────────────────────
interface TagProps {
  text: string;
  color?: string;
  textColor?: string;
}

export const Tag = ({ text, color = Colors.gray[200], textColor = Colors.text.primary }: TagProps) => {
  const styles = StyleSheet.create({
    tag: {
      backgroundColor: color,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: Typography.sizes.sm,
      color: textColor,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

// ─── Skeleton Component ────────────────────────────────────
interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
}

export const Skeleton = React.forwardRef<View, SkeletonProps>(
  ({ width = '100%', height = 20, style, ...props }, ref) => {
    const styles = StyleSheet.create({
      skeleton: {
        width,
        height,
        backgroundColor: Colors.gray[200],
        borderRadius: BorderRadius.md,
      },
    });

    return <View ref={ref} style={[styles.skeleton, style]} {...props} />;
  },
);

Skeleton.displayName = 'Skeleton';

export default {
  Button,
  Card,
  Badge,
  Avatar,
  Chip,
  Tag,
  Skeleton,
};
