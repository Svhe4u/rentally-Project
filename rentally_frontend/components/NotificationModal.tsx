import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationModalProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

const iconMap: Record<NotificationType, { name: string; color: string }> = {
  success: { name: 'checkmark-circle', color: '#10B981' },
  error: { name: 'close-circle', color: '#EF4444' },
  warning: { name: 'alert-circle', color: '#F59E0B' },
  info: { name: 'information-circle', color: '#3B82F6' },
};

const bgColorMap: Record<NotificationType, string> = {
  success: '#10B98110',
  error: '#EF444410',
  warning: '#F59E0B10',
  info: '#3B82F610',
};

export default function NotificationModal({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
}: NotificationModalProps) {
  const icon = iconMap[type];
  const bgColor = bgColorMap[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Icon */}
          <View style={[s.iconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon.name as any} size={48} color={icon.color} />
          </View>

          {/* Title */}
          <Text style={s.title}>{title}</Text>

          {/* Message */}
          <Text style={s.message}>{message}</Text>

          {/* Buttons */}
          <View style={s.buttonRow}>
            {onConfirm && (
              <TouchableOpacity
                style={[s.button, s.buttonSecondary]}
                onPress={onClose}
              >
                <Text style={s.buttonTextSecondary}>Хаах</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.button, s.buttonPrimary]}
              onPress={onConfirm || onClose}
            >
              <Text style={s.buttonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.bg,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
