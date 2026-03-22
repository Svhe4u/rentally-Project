import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Button,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (tab: TabName) => void;
}

function QuickIconItem({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.quickItem} activeOpacity={0.7}>
      <View style={styles.quickCircle}>
        <Text style={styles.quickCircleIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSub}>{sub}</Text>
        </View>
      </View>
      <Text style={styles.menuChev}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          БАЙ<Text style={styles.logoAccent}>Р</Text>
        </Text>
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchTxt}>Ямар байр хайж байна вэ?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2-col categories */}
        <View style={styles.catGrid}>
          <TouchableOpacity
            style={[styles.catCard, { flex: 1 }]}
            onPress={() => onNavigate('map')}
            activeOpacity={0.85}
          >
            <Text style={styles.catTitle}>Нэг/Хоёр өрөө</Text>
            <Text style={styles.catSub}>Гэр, вилла, оффис{'\n'}Бүх орон сууц!</Text>
            <Text style={styles.catIcon}>🏢</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.catCard, { flex: 1 }]}
            onPress={() => onNavigate('map')}
            activeOpacity={0.85}
          >
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeTxt}>ШИНЭ</Text>
            </View>
            <Text style={styles.catTitle}>Апартмент</Text>
            <Text style={styles.catSub}>Хамгийн хурдан{'\n'}бодит үнэ ⚡</Text>
            <Text style={styles.catIcon}>🏬</Text>
          </TouchableOpacity>
        </View>

        {/* 3-col categories */}
        <View style={styles.catRow3}>
          {[
            { icon: '🏡', label: 'Гэр/Вилла' },
            { icon: '🏨', label: 'Оффис тел' },
            { icon: '🏗️', label: 'Шинэ барилга' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.catCardSm}
              onPress={() => onNavigate('map')}
              activeOpacity={0.85}
            >
              <Text style={styles.catIconSm}>{item.icon}</Text>
              <Text style={styles.catTitleSm}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Home widget */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetTop}>
            <View>
              <Text style={styles.widgetTitle}>Миний гэр</Text>
              <Text style={styles.widgetSub}>1 минутад хүссэн байраа ол!</Text>
            </View>
            <Text style={styles.widgetQuick}>Хурдан олох ›</Text>
          </View>
          <View style={styles.quickRow}>
            <QuickIconItem icon="⚙️" label="Удирдах" />
            <QuickIconItem icon="💰" label="Байр оруулах" />
            <QuickIconItem icon="🔍" label="Байр хайх" />
            <QuickIconItem icon="ℹ️" label="Мэдээлэл" />
          </View>
        </View>

        {/* Promo banner */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>
              Хамгийн{' '}
              <Text style={styles.promoHighlight}>хүсэмжтэй</Text>
              {'\n'}апартментийн брэнд?
            </Text>
            <Text style={styles.promoSub}>Санал асуулгад оролцоод шагнал аваарай!</Text>
          </View>
          <View style={styles.promoSticker}>
            <Text style={{ fontSize: 22 }}>☕</Text>
            <Text style={styles.promoStickerTxt}>50,000₮</Text>
            <Text style={styles.promoStickerMini}>2/2</Text>
          </View>
        </TouchableOpacity>

        {/* AI section */}
        <View style={styles.aiSection}>
          <Text style={styles.aiLabel}>
            Таны сонирхсон{' '}
            <Text style={styles.aiHighlight}>Баянгол</Text>
            {' '}хороолол,{'\n'}AI танд хайж өгсөн 🔍
          </Text>
          <View style={styles.tagRow}>
            <TouchableOpacity style={styles.tagDark}>
              <Text style={styles.tagDarkTxt}>#Эрэлтэй байр</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagOutline}>
              <Text style={styles.tagOutlineTxt}>#Ганцаардлын тохиромжтой</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagOutline}>
              <Text style={styles.tagOutlineTxt}>#Хотын төвд</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions section */}
        <View style={styles.actionSection}>
          <Text style={styles.actionLabel}>Хурдан үйлдэл</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionBtnWrapper}>
              <Button title="Надад санал болгох" onPress={() => Alert.alert('Санал болгох', 'Таны хүсэлтийг хүлээж авлаа')} color={Colors.primary} />
            </View>
            <View style={styles.actionBtnWrapper}>
              <Button title="Бусадтай хуваалцах" onPress={() => Alert.alert('Хуваалцах', 'Линк хуулагдлаа')} color="#f39c12" />
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomNav active="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  logo: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  logoAccent: { color: Colors.yellow },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchIcon: { fontSize: 16 },
  searchTxt: { fontSize: 13, color: Colors.textLight },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  catGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  catCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  catTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  catSub: { fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
  catIcon: { fontSize: 36, textAlign: 'right', marginTop: 8 },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.red,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeTxt: { fontSize: 10, fontWeight: '800', color: Colors.white },

  catRow3: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  catCardSm: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  catIconSm: { fontSize: 30, marginBottom: 6, textAlign: 'center' },
  catTitleSm: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  widgetCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  widgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  widgetTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  widgetSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  widgetQuick: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickCircle: {
    width: 48,
    height: 48,
    backgroundColor: Colors.iconBg,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCircleIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#444', textAlign: 'center' },

  promoBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.darkBg,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoTitle: { fontSize: 17, fontWeight: '800', color: Colors.white, lineHeight: 26, marginBottom: 6 },
  promoHighlight: { color: '#60b4ff' },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  promoSticker: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginLeft: 12,
  },
  promoStickerTxt: { fontSize: 11, color: Colors.white, fontWeight: '700', marginTop: 2 },
  promoStickerMini: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  aiSection: { marginHorizontal: 12, marginBottom: 10 },
  aiLabel: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10, lineHeight: 22 },
  aiHighlight: { color: Colors.primary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagDark: {
    backgroundColor: Colors.black,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tagDarkTxt: { fontSize: 12, fontWeight: '700', color: Colors.white },
  tagOutline: {
    backgroundColor: Colors.white,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  tagOutlineTxt: { fontSize: 12, fontWeight: '700', color: '#333' },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  menuSub: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 1 },
  menuChev: { fontSize: 16, color: '#ccc' },

  actionSection: { marginHorizontal: 12, marginBottom: 16, marginTop: 10 },
  actionLabel: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  actionBtnWrapper: { flex: 1, borderRadius: 8, overflow: 'hidden' },
});
