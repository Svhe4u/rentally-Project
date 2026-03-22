import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

export type TabName = 'home' | 'saved' | 'map' | 'community' | 'profile';

interface NavItem {
  key: TabName;
  // Unicode symbols that read as clean icons
  icon: string;
  iconActive: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',      icon: '\u2302',  iconActive: '\u2302',  label: 'Нүүр' },       // ⌂
  { key: 'saved',     icon: '\u2661',  iconActive: '\u2665',  label: 'Хадгалсан' },  // ♡ ♥
  { key: 'map',       icon: '\u25CE',  iconActive: '\u25C9',  label: 'Газрын зураг' }, // ◎ ◉
  { key: 'community', icon: '\u2610',  iconActive: '\u2611',  label: 'Нийгэмлэг' },  // ☐ ☑
  { key: 'profile',   icon: '\u25A1',  iconActive: '\u25A0',  label: 'Профайл' },     // □ ■
];

interface Props {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}

function Tab({
  item,
  isActive,
  onPress,
}: {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale     = useRef(new Animated.Value(1)).current;
  const glowOp    = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelOp   = useRef(new Animated.Value(isActive ? 1 : 0.38)).current;
  const pillW     = useRef(new Animated.Value(isActive ? 32 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glowOp,  { toValue: isActive ? 1 : 0,    useNativeDriver: true,  speed: 20 }),
      Animated.spring(labelOp, { toValue: isActive ? 1 : 0.38, useNativeDriver: true,  speed: 20 }),
      Animated.spring(pillW,   { toValue: isActive ? 32 : 0,   useNativeDriver: false, speed: 20, bounciness: 8 }),
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
        <Text style={[st.icon, isActive && st.iconOn]}>
          {isActive ? item.iconActive : item.icon}
        </Text>

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
      {/* top edge — thin blue line when anything active */}
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
const BG          = '#ffffffff';      // deep navy / near-black
const BLUE        = '#2e55fa';      // brand blue
const BLUE_LIGHT  = '#6080ff';      // lighter blue for glow
const WHITE       = '#ffffff';
const INACTIVE    = '#3a4466';      // muted blue-grey

const st = StyleSheet.create({
  wrap: {
    backgroundColor: BG,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
  },
  edgeLine: {
    height: 1.5,
    backgroundColor: BLUE,
    opacity: 0.35,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
  },

  // per-tab
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingTop: 4,
  },

  // blue radial glow behind active icon
  glow: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE_LIGHT,
    opacity: 0,
    // blur not natively supported but transparency gives soft feel
  },

  // symbol icon
  icon: {
    fontSize: 26,
    lineHeight: 30,
    color: INACTIVE,
  },
  iconOn: {
    color: WHITE,
  },

  // animated underline pill
  pill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: BLUE,
    marginTop: 1,
  },

  // label
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: INACTIVE,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  labelOn: {
    color: BLUE_LIGHT,
    fontWeight: '800',
  },
});
