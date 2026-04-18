import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { BookingAPI, Booking } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

const STATUS_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  pending:   { icon: 'time', color: '#F59E0B', label: 'Хүлээгдэж байна' },
  confirmed: { icon: 'checkmark-circle', color: '#10B981', label: 'Баталгаажсан' },
  cancelled: { icon: 'close-circle', color: Colors.red,   label: 'Цуцлагдсан' },
  completed: { icon: 'flag', color: Colors.primary, label: 'Дууссан' },
};

export default function NotificationsScreen({ onNavigate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await BookingAPI.list();
      setBookings(data.reverse());
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const renderItem = ({ item }: { item: Booking }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => onNavigate('listingDetail', { listingId: item.listing_id })}
        activeOpacity={0.85}
      >
        <View style={[s.iconWrap, { backgroundColor: cfg.color + '1A' }]}>
          <Ionicons name={cfg.icon} size={24} color={cfg.color} />
        </View>
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.cardTitle}>Захиалга #{item.id}</Text>
            <View style={[s.statusBadge, { backgroundColor: cfg.color + '1A' }]}>
              <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={s.cardSub}>
            Байр #{item.listing_id} · {item.start_date} – {item.end_date}
          </Text>
          {item.total_price && (
            <Text style={s.cardPrice}>{Number(item.total_price).toLocaleString()}₮</Text>
          )}
          <Text style={s.cardTime}>
            {new Date(item.created_at).toLocaleDateString('mn-MN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.logo}>РЕНТАЛ<Text style={s.logoAccent}>ЛИ</Text></Text>
        <TouchableOpacity style={s.topBtn} onPress={() => onNavigate('profile')}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={s.pageHeader}>
        <Text style={s.headerTitle}>Мэдэгдэл</Text>
      </View>

      {/* Status legend */}
      <View style={s.legend}>
        {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
          <View key={cfg.label} style={s.legendItem}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[s.legendTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🔔</Text>
              <Text style={s.emptyTxt}>Мэдэгдэл байхгүй</Text>
              <Text style={s.emptySub}>Захиалга өгсний дараа мэдэгдэл ирнэ</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  logo: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  logoAccent: { color: Colors.yellow },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  pageHeader: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  legend:  { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendIcon: { fontSize: 14 },
  legendTxt:  { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { padding: 12, gap: 10 },
  card:   { flexDirection: 'row', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '800' },
  cardSub:     { fontSize: 12, color: Colors.textMuted },
  cardPrice:   { fontSize: 13, fontWeight: '800', color: Colors.primary },
  cardTime:    { fontSize: 11, color: Colors.textLight },
  emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTxt:  { fontSize: 17, fontWeight: '800', color: Colors.text },
  emptySub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
