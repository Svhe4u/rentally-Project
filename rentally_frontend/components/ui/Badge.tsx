import * as React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'items-center rounded-full border px-3 py-1',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary',
        destructive: 'border-transparent bg-destructive',
        outline: 'border-border bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-xs font-bold uppercase tracking-wider', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  label?: string;
  labelClasses?: string;
}

function Badge({ className, variant, label, labelClasses, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), 'self-start', className)} {...props}>
      {children ? children : (
        <Text className={cn(badgeTextVariants({ variant }), labelClasses)}>
          {label}
        </Text>
      )}
    </View>
  );
}

export { Badge, badgeVariants };
