/**
 * Feedback Components
 * Includes Toast, Modal, Alert Dialog, Bottom Sheet
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Animation, ZIndex } from '../theme';

const { height: screenHeight } = Dimensions.get('window');

// ─── Toast Notification Component ──────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

let toastQueue: ToastProps[] = [];
let currentToast: ToastProps | null = null;

const useToast = () => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (props: ToastProps) => {
    setToast(props);
    currentToast = props;

    const timer = setTimeout(() => {
      setToast(null);
      currentToast = null;
    }, props.duration || 3000);

    return () => clearTimeout(timer);
  };

  return { toast, showToast };
};

export const Toast = ({ message, type = 'info', duration = 3000, action }: ToastProps) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: Animation.normal,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: Animation.normal,
        useNativeDriver: true,
      }).start();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const typeStyles = {
    success: { bg: Colors.success, icon: 'checkmark-circle' },
    error: { bg: Colors.danger, icon: 'alert-circle' },
    warning: { bg: Colors.warning, icon: 'warning' },
    info: { bg: Colors.info, icon: 'information-circle' },
  };

  const selected = typeStyles[type];

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: ZIndex.notification,
    },
    toast: {
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.lg,
      backgroundColor: selected.bg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      ...Shadows.lg,
    },
    content: {
      flex: 1,
    },
    message: {
      color: Colors.white,
      fontSize: Typography.sizes.base,
      fontWeight: '500',
    },
    action: {
      color: Colors.white,
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.toast}>
        <Ionicons name={selected.icon as any} size={20} color={Colors.white} />
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </View>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={styles.action}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Alert Dialog Component ────────────────────────────────
interface AlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  icon?: string;
}

export const AlertDialog = ({
  visible,
  title,
  message,
  buttons,
  icon,
}: AlertDialogProps) => {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialog: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: '85%',
      alignItems: 'center',
      ...Shadows.xl,
    },
    icon: {
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: Typography.sizes.lg,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: Typography.sizes.base,
      color: Colors.text.secondary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      width: '100%',
    },
    button: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: Colors.primary,
    },
    dangerButton: {
      backgroundColor: Colors.danger,
    },
    secondaryButton: {
      backgroundColor: Colors.gray[100],
    },
    buttonText: {
      fontSize: Typography.sizes.base,
      fontWeight: '600',
      color: Colors.white,
    },
    secondaryButtonText: {
      color: Colors.text.primary,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {icon && (
            <View style={styles.icon}>
              <Ionicons name={icon as any} size={48} color={Colors.primary} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  btn.variant === 'primary' && styles.primaryButton,
                  btn.variant === 'danger' && styles.dangerButton,
                  btn.variant === 'secondary' && styles.secondaryButton,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.variant === 'secondary' && styles.secondaryButtonText,
                  ]}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Bottom Sheet Component ────────────────────────────────
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}

export const BottomSheet = ({
  visible,
  onClose,
  title,
  children,
  height = screenHeight * 0.6,
}: BottomSheetProps) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: Animation.normal,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: Animation.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height,
      backgroundColor: Colors.white,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      ...Shadows.lg,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: Colors.gray[300],
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: Typography.sizes.lg,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Confirm Dialog Component ──────────────────────────────
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Тийм',
  cancelText = 'Цуцлах',
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmDialogProps) => {
  return (
    <AlertDialog
      visible={visible}
      title={title}
      message={message}
      buttons={[
        {
          label: cancelText,
          onPress: onCancel,
          variant: 'secondary',
        },
        {
          label: confirmText,
          onPress: onConfirm,
          variant: isDangerous ? 'danger' : 'primary',
        },
      ]}
    />
  );
};

export { useToast };

export default {
  Toast,
  AlertDialog,
  BottomSheet,
  ConfirmDialog,
  useToast,
};
