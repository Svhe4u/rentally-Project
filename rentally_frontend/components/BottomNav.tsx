import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export type TabName = 'home' | 'saved' | 'map' | 'community' | 'profile';

interface NavItem {
  key: TabName;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',      icon: '🏠', label: 'Нүүр' },
  { key: 'saved',     icon: '🤍', label: 'Хадгалсан' },
  { key: 'map',       icon: '📍', label: 'Газрын зураг' },
  { key: 'community', icon: '💬', label: 'Нийгэмлэг' },
  { key: 'profile',   icon: '⋮⋮', label: 'Цэс' },
];

interface BottomNavProps {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => onNavigate(item.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 24,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
  },
});
