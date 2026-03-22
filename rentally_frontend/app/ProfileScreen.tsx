import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (tab: TabName) => void;
}

interface MenuItemProps {
  icon: string;
  title: string;
  sub: string;
}

function MenuItem({ icon, title, sub }: MenuItemProps) {
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

interface StatItemProps {
  icon: string;
  label: string;
  count: number;
  bordered?: boolean;
}

function StatItem({ icon, label, count, bordered = true }: StatItemProps) {
  return (
    <TouchableOpacity
      style={[styles.statItem, bordered && styles.statItemBorder]}
      activeOpacity={0.7}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statCount}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Topbar */}
        <View style={styles.topBar}>
          <Text style={styles.notifBtn}>🔔</Text>
        </View>

        {/* User info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>Гансүх гишүүн</Text>
              <Text style={styles.nameChev}> ›</Text>
            </View>
            <Text style={styles.userPlatform}>🍎 Apple</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statCard}>
          <StatItem icon="🏠" label="Миний гэр" count={0} />
          <StatItem icon="📋" label="Зарын тэмдэглэл" count={0} />
          <StatItem icon="💬" label="Миний яриа" count={0} bordered={false} />
        </View>

        {/* Quick links menu */}
        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Хурдан холбоос</Text>
          <MenuItem icon="📞" title="Лавласан байр" sub="Чат · Мессеж · Утас" />
          <MenuItem icon="🚨" title="Хуурамч зар мэдэгдэх" sub="Шууд зар мэдэгдсэн тохиолдол" />
          <MenuItem icon="🎉" title="Урамшуулал" sub="Урамшуулал · Санал асуулга" />
          <MenuItem icon="📰" title="Байрны мэдээ" sub="Шинэ үйлчилгээ · Шинэчлэлт" />
          <MenuItem icon="🎧" title="Тусламжийн төв" sub="Мэдэгдэл · 1:1 асуулт · FAQ" />
        </View>

        {/* Version */}
        <View style={styles.versionCard}>
          <View>
            <Text style={styles.verLabel}>Апп хувилбар</Text>
            <Text style={styles.verNum}>5.19.0</Text>
          </View>
          <Text style={styles.verLatest}>Хамгийн сүүлийн хувилбар.</Text>
        </View>

        {/* SNS */}
        <View style={styles.snsCard}>
          <Text style={styles.snsTitle}>БАЙР СОШИАЛ</Text>
          <View style={styles.snsGrid}>
            {[
              { icon: '📷', label: 'Инстаграм' },
              { icon: '📘', label: 'Фэйсбүүк' },
              { icon: '📝', label: 'Нийтлэл' },
              { icon: '▶️', label: 'Ютуб' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.snsItem} activeOpacity={0.7}>
                <View style={styles.snsIconWrap}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <Text style={styles.snsLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PRO banner */}
        <TouchableOpacity style={styles.proBanner} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={styles.proTxt}>
              Мэргэжлийн зуучлагч бол{'\n'}Байр PRO-г туршаарай!
            </Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={{ fontSize: 20 }}>🏠</Text>
            <Text style={styles.proBadgeLbl}>PRO</Text>
            <Text style={{ color: Colors.white, fontSize: 14 }}>⬇</Text>
          </View>
        </TouchableOpacity>

        {/* Footer links */}
        <View style={styles.footerLinks}>
          {['Үйлчилгээний нөхцөл', 'Нууцлалын бодлого', 'Компанийн тухай'].map((link, i) => (
            <React.Fragment key={link}>
              {i > 0 && <Text style={styles.footerSep}>|</Text>}
              <TouchableOpacity>
                <Text style={styles.footerLink}>{link}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.footerHours}>
          {'Даваа–Баасан: 10:00 – 18:30 (Бямба, Ням амарна)\nЦайны цаг: 12:30 – 13:30'}
        </Text>

        {/* Footer buttons */}
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.footerBtn} activeOpacity={0.8}>
            <Text style={styles.footerBtnTxt}>📞 Тусламжийн төв</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn} activeOpacity={0.8}>
            <Text style={styles.footerBtnTxt}>📣 Зар сурталчилгаа</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  topBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  notifBtn: { fontSize: 22 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    backgroundColor: '#ddd',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 28, color: '#999' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  nameChev: { fontSize: 14, color: '#aaa' },
  userPlatform: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  statCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 8,
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  statIcon: { fontSize: 26 },
  statLabelRow: { alignItems: 'center', gap: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  statCount: { fontSize: 14, fontWeight: '900', color: Colors.primary },

  menuCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  menuSub: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 1 },
  menuChev: { fontSize: 16, color: '#ccc' },

  versionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  verNum: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 2 },
  verLatest: { fontSize: 14, fontWeight: '700', color: Colors.textLight },

  snsCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  snsTitle: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 14 },
  snsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  snsItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  snsIconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snsLabel: { fontSize: 13, fontWeight: '700', color: '#333' },

  proBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.darkBg,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  proTxt: { fontSize: 15, fontWeight: '800', color: Colors.white, lineHeight: 24 },
  proBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginLeft: 12,
    gap: 2,
  },
  proBadgeLbl: { fontSize: 12, fontWeight: '900', color: Colors.white },

  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  footerLink: { fontSize: 11, color: '#bbb', fontWeight: '600' },
  footerSep: { fontSize: 11, color: '#ddd' },

  footerHours: {
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },

  footerBtns: {
    flexDirection: 'row',
    marginHorizontal: 12,
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  footerBtnTxt: { fontSize: 13, fontWeight: '700', color: '#333' },
});
