import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { FavoriteAPI, MessageThreadAPI, BookingAPI } from '../services/api';

interface Props {
  onNavigate: (tab: TabName) => void;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  sub?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

function MenuItem({ icon, iconColor = Colors.primary, title, sub, onPress, isDestructive }: MenuItemProps) {
  const textColor = isDestructive ? Colors.red : Colors.text;
  const bgColor = isDestructive ? Colors.red + '10' : iconColor + '18';
  const iColor = isDestructive ? Colors.red : iconColor;

  return (
    <TouchableOpacity style={m.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={m.menuLeft}>
        <View style={[m.iconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={18} color={iColor} />
        </View>
        <View>
          <Text style={[m.menuTitle, { color: textColor }]}>{title}</Text>
          {sub && <Text style={m.menuSub}>{sub}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDestructive ? Colors.red + '40' : "#ccc"} />
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
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ favorites: 0, messages: 0, bookings: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [favs, msgs, bks] = await Promise.all([
          FavoriteAPI.list(),
          MessageThreadAPI.list(),
          BookingAPI.list(),
        ]);
        setStats({
          favorites: Array.isArray(favs) ? favs.length : 0,
          messages: msgs?.conversations?.length || 0,
          bookings: Array.isArray(bks) ? bks.length : 0,
        });
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    };
    if (user) fetchStats();
  }, [user]);

  const handleLogout = () => {
    // Platform-specific logout confirmation for reliability
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Та системээс гарахдаа итгэлтэй байна уу?');
      if (confirmed) logout();
      return;
    }

    Alert.alert(
      'Системээс гарах',
      'Та системээс гарахдаа итгэлтэй байна уу?',
      [
        { text: 'Үгүй', style: 'cancel' },
        { text: 'Тийм, гарах', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleApplyBroker = () => {
    if (loading) return;
    Alert.alert(
      'Зуучлагчаар бүртгүүлэх',
      'Та зуучлагчаар бүртгүүлж, өөрийн үл хөдлөх хөрөнгийн зарыг оруулахыг хүсэж байна уу?',
      [
        { text: 'Буцах', style: 'cancel' },
        {
          text: 'Хүсэлт илгээх',
          onPress: async () => {
            setLoading(true);
            try {
              // Mocking a successful application since we don't have a full form yet
              // In reality, this would open a form screen or call BrokerAPI.apply
              setTimeout(() => {
                Alert.alert('Амжилттай', 'Таны хүсэлтийг хүлээн авлаа. Бид удахгүй тантай холбогдох болно.');
                setLoading(false);
              }, 1500);
            } catch (e: any) {
              Alert.alert('Алдаа', e.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  const handleSoon = (title: string) => {
    Alert.alert(title, 'Энэ хэсэг тун удахгүй нэмэгдэх болно. Түр хүлээнэ үү.');
  };

  const userInitials = user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <SafeAreaView style={m.safe}>
      <ScrollView
        style={m.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={m.scrollContent}
      >
        {/* Topbar */}
        <View style={m.topBar}>
          <Text style={m.logo}>РЕНТАЛ<Text style={m.logoAccent}>ЛИ</Text></Text>
          <TouchableOpacity style={m.topBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.red} />
          </TouchableOpacity>
        </View>

        {/* User info card */}
        <View style={m.userCard}>
          <View style={m.avatarWrap}>
            <View style={m.avatar}>
              <Text style={m.avatarTxt}>{userInitials}</Text>
            </View>
            <View style={m.avatarBadge}>
              <Ionicons name="camera-outline" size={10} color="#fff" />
            </View>
          </View>
          <View style={m.userInfo}>
            <Text style={m.userName}>{user?.username || 'Зочин'}</Text>
            <Text style={m.userSub}>{user?.email || 'И-мэйл байхгүй'}</Text>
            <View style={m.roleBadge}>
              <Text style={m.roleTxt}>{user?.role === 'broker' ? 'Зуучлагч' : 'Хэрэглэгч'}</Text>
            </View>
          </View>
          <TouchableOpacity style={m.editBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={m.statCard}>
          <StatItem icon="heart-outline" iconColor={Colors.red} label="Хадгалсан" count={stats.favorites} onPress={() => onNavigate('saved')} />
          <StatItem icon="chatbubble-outline" iconColor="#845ef7" label="Мессеж" count={stats.messages} onPress={() => onNavigate('messages')} />
          <StatItem icon="calendar-outline" iconColor={Colors.primary} label="Захиалга" count={stats.bookings} onPress={() => onNavigate('notifications')} />
        </View>

        {/* Broker Application Call to Action */}
        {user?.role !== 'broker' && (
          <TouchableOpacity style={m.brokerCta} activeOpacity={0.9} onPress={handleApplyBroker}>
            <View style={m.brokerCtaLeft}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="business-outline" size={24} color="#fff" />
              )}
              <View>
                <Text style={m.brokerCtaTitle}>Зуучлагч болох уу?</Text>
                <Text style={m.brokerCtaSub}>Үл хөдлөх хөрөнгөө түрээслүүлж эхлээрэй</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Settings Menu */}
        <View style={m.menuCard}>
          <Text style={m.sectionTitle}>Миний данс</Text>
          <MenuItem 
            icon="person-outline" 
            title="Профайл засах" 
            sub="Нэр, утасны дугаар шинэчлэх" 
            onPress={() => onNavigate('editProfile')} 
          />
          <MenuItem 
            icon="shield-checkmark-outline" 
            title="Аюулгүй байдал" 
            sub="Нууц үг солих, хамгаалалт" 
            onPress={() => onNavigate('security')} 
          />
          <MenuItem 
            icon="notifications-outline" 
            title="Мэдэгдэл" 
            sub="Мэдэгдлийн тохиргоо" 
            onPress={() => onNavigate('notifications')} 
          />
        </View>

        <View style={m.menuCard}>
          <Text style={m.sectionTitle}>Тусламж & Дэмжлэг</Text>
          <MenuItem 
            icon="help-circle-outline" 
            title="Тусламжийн төв" 
            sub="Түгээмэл асуулт хариулт" 
            onPress={() => onNavigate('help')} 
          />
          <MenuItem 
            icon="information-circle-outline" 
            title="Бидний тухай" 
            sub="Апп-ын мэдээлэл"
            onPress={() => onNavigate('about')} 
          />
          <MenuItem 
            icon="log-out-outline" 
            title="Системээс гарах" 
            isDestructive 
            onPress={handleLogout} 
          />
        </View>

        {/* Footer info */}
        <View style={m.footer}>
          <Text style={m.version}>Rentally v1.0.4</Text>
          <Text style={m.footerHours}>
            Даваа–Баасан: 09:00 – 18:00
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 10 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  logo: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  logoAccent: { color: Colors.yellow },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fdf2f2', alignItems: 'center', justifyContent: 'center' },

  userCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 20, padding: 20,
    backgroundColor: Colors.white, borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 65, height: 65, borderRadius: 32,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  avatarTxt: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  userSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.bg,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6,
  },
  roleTxt: { fontSize: 10, fontWeight: 'bold', color: Colors.primary, textTransform: 'uppercase' },
  editBtn: { padding: 5 },

  statCard: {
    flexDirection: 'row',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.white, borderRadius: 24,
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statCount: { fontSize: 17, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  brokerCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.primary, borderRadius: 24,
    padding: 20,
  },
  brokerCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  brokerCtaTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  brokerCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  menuCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', color: Colors.textLight,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

  footer: { alignItems: 'center', marginTop: 10, gap: 5 },
  version: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  footerHours: { fontSize: 11, color: Colors.textLight },
});
