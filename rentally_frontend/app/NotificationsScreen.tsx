import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { BookingAPI, Booking } from '../services/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  userId?: number;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  pending:   { icon: '⏳', color: '#F59E0B', label: 'Хүлээгдэж байна' },
  confirmed: { icon: '✅', color: '#10B981', label: 'Баталгаажсан' },
  cancelled: { icon: '❌', color: Colors.red,   label: 'Цуцлагдсан' },
  completed: { icon: '🏁', color: Colors.primary, label: 'Дууссан' },
};

export default function NotificationsScreen({ onNavigate, userId = 1 }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    BookingAPI.list(userId)
      .then(data => setBookings(data.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const renderItem = ({ item }: { item: Booking }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => onNavigate('listingDetail', { listingId: item.listing_id })}
        activeOpacity={0.85}
      >
        <View style={[s.iconWrap, { backgroundColor: cfg.color + '1A' }]}>
          <Text style={s.icon}>{cfg.icon}</Text>
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
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Мэдэгдэл</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status legend */}
      <View style={s.legend}>
        {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
          <View key={cfg.label} style={s.legendItem}>
            <Text style={s.legendIcon}>{cfg.icon}</Text>
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
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
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
