import * as React from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { cn } from '../../utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClasses?: string;
  labelClasses?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, containerClasses, labelClasses, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <View className={cn('flex flex-col gap-1.5 w-full', containerClasses)}>
        {label && (
          <Text className={cn('text-sm font-semibold text-foreground/70 ml-1', labelClasses)}>
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center h-14 w-full rounded-2xl border-2 border-input bg-card px-4 transition-all',
            isFocused && 'border-primary bg-background',
            error && 'border-destructive',
            className
          )}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-base text-foreground py-0 h-full"
            placeholderTextColor="#94a3b8"
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            style={{ textAlignVertical: 'center' }}
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text className="text-xs font-medium text-destructive ml-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
