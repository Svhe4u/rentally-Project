import * as React from 'react';
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-full transition-all active:opacity-70',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-3',
        lg: 'h-14 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const textVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  label?: string;
  labelClasses?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

function Button({
  className,
  variant,
  size,
  label,
  labelClasses,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size, className }), loading && 'opacity-70')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="currentColor" />
      ) : children ? (
        children
      ) : (
        <Text className={cn(textVariants({ variant, size }), labelClasses)}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export { Button, buttonVariants };
