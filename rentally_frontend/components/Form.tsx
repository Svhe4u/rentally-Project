/**
 * Form Components with Validation Display
 * Includes TextInput, Select, DatePicker, and error display
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput as RNTextInput, TouchableOpacity,
  StyleSheet, KeyboardTypeOptions, ViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../theme';
import { Row } from './Layout';

// ─── Form Input Component ───────────────────────────────────
interface FormInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  helper?: string;
  required?: boolean;
}

export const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  maxLength,
  editable = true,
  helper,
  required = false,
}: FormInputProps) => {
  const [focused, setFocused] = useState(false);

  const hasError = error ? true : false;

  const styles = StyleSheet.create({
    container: { marginBottom: Spacing.lg },
    label: {
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
    },
    required: {
      color: Colors.danger,
      marginLeft: Spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: Colors.background.secondary,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: hasError ? Colors.danger : (focused ? Colors.primary : Colors.border),
      paddingHorizontal: Spacing.md,
      paddingVertical: multiline ? Spacing.md : 0,
      height: multiline ? 100 : Layout.inputHeight,
      ...Shadows.xs,
    },
    input: {
      flex: 1,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary,
      fontWeight: '400',
      paddingVertical: multiline ? 0 : Spacing.md,
      paddingLeft: icon ? Spacing.md : 0,
      paddingRight: rightIcon ? Spacing.md : 0,
    },
    icon: {
      marginRight: Spacing.sm,
    },
    rightIcon: {
      marginLeft: Spacing.sm,
    },
    errorText: {
      fontSize: Typography.sizes.xs,
      color: Colors.danger,
      marginTop: Spacing.xs,
      fontWeight: '500',
    },
    helperText: {
      fontSize: Typography.sizes.xs,
      color: Colors.text.secondary,
      marginTop: Spacing.xs,
    },
    counter: {
      fontSize: Typography.sizes.xs,
      color: Colors.text.tertiary,
      marginTop: Spacing.xs,
      alignSelf: 'flex-end',
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={focused ? Colors.primary : Colors.text.secondary}
            style={styles.icon}
          />
        )}

        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.light}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={8}
          >
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Row align="center" gap="xs">
          <Ionicons name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Row>
      )}

      {!error && helper && <Text style={styles.helperText}>{helper}</Text>}

      {maxLength && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// ─── Select Component ──────────────────────────────────────
export interface SelectOption {
  label: string;
  value: string | number;
}

interface FormSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | number | null;
  onSelect: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormSelect = ({
  label,
  placeholder = 'Сонголох',
  options,
  value,
  onSelect,
  error,
  required = false,
  disabled = false,
}: FormSelectProps) => {
  const [showOptions, setShowOptions] = useState(false);

  const selected = options.find(opt => opt.value === value);

  const styles = StyleSheet.create({
    container: { marginBottom: Spacing.lg },
    label: {
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
    },
    required: {
      color: Colors.danger,
      marginLeft: Spacing.xs,
    },
    selectButton: {
      backgroundColor: Colors.background.secondary,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: error ? Colors.danger : Colors.border,
      height: Layout.inputHeight,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Shadows.xs,
    },
    buttonText: {
      fontSize: Typography.sizes.base,
      color: selected ? Colors.text.primary : Colors.text.light,
      fontWeight: '400',
      flex: 1,
    },
    optionsContainer: {
      position: 'absolute',
      top: 100,
      left: 0,
      right: 0,
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      zIndex: 10,
      ...Shadows.lg,
    },
    option: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    optionText: {
      fontSize: Typography.sizes.base,
      color: Colors.text.primary,
    },
    optionSelected: {
      backgroundColor: Colors.primary,
    },
    optionTextSelected: {
      color: Colors.white,
    },
    errorText: {
      fontSize: Typography.sizes.xs,
      color: Colors.danger,
      marginTop: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => !disabled && setShowOptions(!showOptions)}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {selected?.label || placeholder}
        </Text>
        <Ionicons
          name={showOptions ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.text.secondary}
        />
      </TouchableOpacity>

      {showOptions && (
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                index === options.length - 1 && { borderBottomWidth: 0 },
                value === option.value && styles.optionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                setShowOptions(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

// ─── Checkbox Component ────────────────────────────────────
interface CheckboxProps {
  checked: boolean;
  onCheck: (checked: boolean) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const Checkbox = ({
  checked,
  onCheck,
  label,
  error,
  disabled = false,
}: CheckboxProps) => {
  const styles = StyleSheet.create({
    container: { marginBottom: Spacing.lg },
    checkbox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    box: {
      width: 20,
      height: 20,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: error ? Colors.danger : Colors.border,
      backgroundColor: checked ? Colors.primary : Colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: Typography.sizes.base,
      color: Colors.text.primary,
    },
    errorText: {
      fontSize: Typography.sizes.xs,
      color: Colors.danger,
      marginTop: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => !disabled && onCheck(!checked)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.box}>
          {checked && (
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          )}
        </View>
        {label && <Text style={styles.label}>{label}</Text>}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ─── Radio Button Component ────────────────────────────────
interface RadioOption {
  label: string;
  value: string | number;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string | number | null;
  onSelect: (value: string | number) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const RadioGroup = ({
  options,
  value,
  onSelect,
  label,
  error,
  required = false,
}: RadioGroupProps) => {
  const styles = StyleSheet.create({
    container: { marginBottom: Spacing.lg },
    label: {
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
      color: Colors.text.primary,
      marginBottom: Spacing.md,
    },
    required: {
      color: Colors.danger,
      marginLeft: Spacing.xs,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: error ? Colors.danger : Colors.border,
      backgroundColor: Colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary,
    },
    optionLabel: {
      fontSize: Typography.sizes.base,
      color: Colors.text.primary,
      flex: 1,
    },
    errorText: {
      fontSize: Typography.sizes.xs,
      color: Colors.danger,
      marginTop: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={styles.option}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, value === option.value && styles.radioSelected]}>
            {value === option.value && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: Colors.white,
                }}
              />
            )}
          </View>
          <Text style={styles.optionLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default {
  FormInput,
  FormSelect,
  Checkbox,
  RadioGroup,
};
