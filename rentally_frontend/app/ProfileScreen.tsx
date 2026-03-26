import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (tab: TabName) => void;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  sub: string;
  onPress?: () => void;
}

function MenuItem({ icon, iconColor = Colors.primary, title, sub, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={m.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={m.menuLeft}>
        <View style={[m.iconWrap, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text style={m.menuTitle}>{title}</Text>
          <Text style={m.menuSub}>{sub}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  count: number;
  onPress?: () => void;
}

function StatItem({ icon, iconColor, label, count, onPress }: StatItemProps) {
  return (
    <TouchableOpacity style={m.statItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[m.statIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={m.statCount}>{count}</Text>
      <Text style={m.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={m.safe}>
      <ScrollView
        style={m.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={m.scrollContent}
      >
        {/* Topbar */}
        <View style={m.topBar}>
          <Text style={m.logo}>БАЙ<Text style={m.logoAccent}>Р</Text></Text>
          <TouchableOpacity style={m.topBtn}>
            <Ionicons name="settings-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* User info card */}
        <View style={m.userCard}>
          <View style={m.avatarWrap}>
            <View style={m.avatar}>
              <Ionicons name="person" size={28} color="#aaa" />
            </View>
            <View style={m.avatarBadge}>
              <Ionicons name="pencil" size={10} color="#fff" />
            </View>
          </View>
          <View style={m.userInfo}>
            <Text style={m.userName}>Гансүх гишүүн</Text>
            <Text style={m.userSub}>Нэвтэрсэн · Apple ID</Text>
          </View>
          <TouchableOpacity style={m.editBtn}>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={m.statCard}>
          <StatItem icon="home-outline" iconColor={Colors.primary} label="Миний гэр" count={0} />
          <StatItem icon="bookmark-outline" iconColor={Colors.yellow} label="Зарын тэмдэглэл" count={0} />
          <StatItem icon="chatbubble-outline" iconColor="#845ef7" label="Миний яриа" count={0} />
        </View>

        {/* Quick links menu */}
        <View style={m.menuCard}>
          <MenuItem
            icon="call-outline" iconColor="#22c55e"
            title="Лавласан байр" sub="Чат · Мессеж · Утас"
          />
          <MenuItem
            icon="shield-checkmark-outline" iconColor={Colors.red}
            title="Хуурамч зар мэдэгдэх" sub="Шууд зар мэдэгдсэн тохиолдол"
          />
          <MenuItem
            icon="gift-outline" iconColor={Colors.yellow}
            title="Урамшуулал" sub="Урамшуулал · Санал асуулга"
          />
          <MenuItem
            icon="newspaper-outline" iconColor="#845ef7"
            title="Байрны мэдээ" sub="Шинэ үйлчилгээ · Шинэчлэлт"
          />
          <MenuItem
            icon="headset-outline" iconColor={Colors.primary}
            title="Тусламжийн төв" sub="Мэдэгдэл · 1:1 асуулт · FAQ"
          />
        </View>

        {/* PRO banner */}
        <TouchableOpacity style={m.proBanner} activeOpacity={0.9}>
          <View style={m.proLeft}>
            <View style={m.proBadge}>
              <Text style={m.proBadgeTxt}>PRO</Text>
            </View>
            <Text style={m.proTitle}>Мэргэжлийн зуучлагч бол{'\n'}Байр PRO-г туршаарай!</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={Colors.primary} />
        </TouchableOpacity>

        {/* SNS */}
        <View style={m.snsCard}>
          <Text style={m.sectionTitle}>БАЙР СОШИАЛ</Text>
          <View style={m.snsGrid}>
            {[
              { icon: 'logo-instagram', label: 'Инстаграм', color: '#E4405F' },
              { icon: 'logo-facebook', label: 'Фэйсбүүк', color: '#1877F2' },
              { icon: 'document-text-outline', label: 'Нийтлэл', color: '#20c997' },
              { icon: 'logo-youtube', label: 'Ютуб', color: '#ff3b5c' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={m.snsItem} activeOpacity={0.7}>
                <View style={[m.snsIconWrap, { borderColor: item.color + '40' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={m.snsLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer links */}
        <View style={m.footerLinks}>
          {['Үйлчилгээний нөхцөл', 'Нууцлалын бодлого', 'Компанийн тухай'].map((link, i) => (
            <React.Fragment key={link}>
              {i > 0 && <Text style={m.footerSep}>·</Text>}
              <TouchableOpacity>
                <Text style={m.footerLink}>{link}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <Text style={m.footerHours}>
          {'Даваа–Баасан: 10:00 – 18:30 (Бямба, Ням амарна)\n'}Цайны цаг: 12:30 – 13:30
        </Text>

        {/* Footer buttons */}
        <View style={m.footerBtns}>
          <TouchableOpacity style={m.footerBtn} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={16} color={Colors.text} />
            <Text style={m.footerBtnTxt}>  Тусламжийн төв</Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.footerBtn} activeOpacity={0.8}>
            <Ionicons name="megaphone-outline" size={16} color={Colors.text} />
            <Text style={m.footerBtnTxt}>  Зар сурталчилгаа</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  // top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  logo: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  logoAccent: { color: Colors.yellow },
  topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // user card
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '900', color: Colors.text },
  userSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  editBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // stats
  statCard: {
    flexDirection: 'row',
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 6,
    borderRightWidth: 1, borderRightColor: '#f0f0f0',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  statCount: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },

  // menu
  menuCard: {
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16, overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  menuSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  menuChev: { fontSize: 16, color: '#ccc' },

  // pro banner
  proBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: Colors.darkBg,
    borderRadius: 16, padding: 18,
  },
  proLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  proBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
  },
  proBadgeTxt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  proTitle: { fontSize: 14, fontWeight: '800', color: '#fff', lineHeight: 22, flex: 1 },

  // SNS
  snsCard: {
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
  },
  snsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  snsItem: {
    width: '45%', flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  snsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  snsLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // footer
  footerLinks: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  footerLink: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  footerSep: { fontSize: 11, color: '#ddd' },
  footerHours: {
    paddingHorizontal: 12, fontSize: 11,
    color: Colors.textLight, lineHeight: 20, marginBottom: 8,
  },
  footerBtns: {
    flexDirection: 'row', marginHorizontal: 12, gap: 10,
  },
  footerBtn: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  footerBtnTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },
});
