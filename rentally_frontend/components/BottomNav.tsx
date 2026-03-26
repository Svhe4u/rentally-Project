import React, { useRef, useEffect } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TabName = 'home' | 'saved' | 'map' | 'messages' | 'profile';

interface NavItem {
  key: TabName;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',      icon: 'home-outline',         iconActive: 'home',           label: 'Нүүр' },       // ⌂ → home
  { key: 'saved',     icon: 'heart-outline',         iconActive: 'heart',          label: 'Хадгалсан' },  // ♡ → heart
  { key: 'map',       icon: 'map-outline',           iconActive: 'map',            label: 'Газрын зураг' }, // ◎ → map
  { key: 'messages', icon: 'chatbubbles-outline',   iconActive: 'chatbubbles',    label: 'Мессеж' },      // 💬
  { key: 'profile',   icon: 'person-outline',       iconActive: 'person',         label: 'Профайл' },     // □ → person
];

interface Props {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}

function Tab({
  item, isActive, onPress,
}: {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale     = useRef(new Animated.Value(1)).current;
  const glowOp    = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelOp   = useRef(new Animated.Value(isActive ? 1 : 0.45)).current;
  const pillW     = useRef(new Animated.Value(isActive ? 28 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glowOp,  { toValue: isActive ? 1 : 0,    useNativeDriver: true,  speed: 20 }),
      Animated.spring(labelOp, { toValue: isActive ? 1 : 0.45, useNativeDriver: true,  speed: 20 }),
      Animated.spring(pillW,   { toValue: isActive ? 28 : 0,   useNativeDriver: false, speed: 20, bounciness: 8 }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.80, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 18, bounciness: 12 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity style={st.tab} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[st.inner, { transform: [{ scale }] }]}>
        {/* glow backdrop behind icon */}
        <Animated.View style={[st.glow, { opacity: glowOp }]} />

        {/* icon */}
        <Ionicons
          name={isActive ? item.iconActive : item.icon}
          size={24}
          color={isActive ? NavColors.primary : NavColors.inactive}
          style={st.icon}
        />

        {/* sliding pill underline */}
        <Animated.View style={[st.pill, { width: pillW }]} />

        {/* label */}
        <Animated.Text
          numberOfLines={1}
          style={[st.label, { opacity: labelOp }, isActive && st.labelOn]}
        >
          {item.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <View style={st.wrap}>
      {/* top edge — thin brand line */}
      <View style={st.edgeLine} />

      <View style={st.row}>
        {NAV_ITEMS.map(item => (
          <Tab
            key={item.key}
            item={item}
            isActive={item.key === active}
            onPress={() => onNavigate(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

// ── palette ──────────────────────────────────────────────────
const NavColors = {
  primary:  '#2e55fa',
  bg:       '#ffffff',
  inactive: '#8b8fa8',
  glow:    '#6080ff',
};

const st = StyleSheet.create({
  wrap: {
    backgroundColor: NavColors.bg,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
  },
  edgeLine: {
    height: 2,
    backgroundColor: NavColors.primary,
    opacity: 0.25,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  glow: {
    position: 'absolute',
    top: -2,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NavColors.glow,
    opacity: 0,
  },
  icon: {
    // handled inline via Ionicons
  },
  pill: {
    height: 2.5,
    borderRadius: 2,
    backgroundColor: NavColors.primary,
    marginTop: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: NavColors.inactive,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  labelOn: {
    color: NavColors.primary,
    fontWeight: '800',
  },
});
