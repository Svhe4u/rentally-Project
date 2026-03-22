import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FavoriteAPI, Favorite } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (screen: string | TabName, params?: any) => void;
  userId?: number;
}

export default function SavedScreen({ onNavigate, userId = 1 }: Props) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FavoriteAPI.list(userId);
      setFavorites(data);
    } catch {
      Alert.alert('Алдаа', 'Хадгалсан байрнуудыг ачаалж чадсангүй');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (listingId: number) => {
    setRemoving(listingId);
    try {
      await FavoriteAPI.remove(listingId, userId);
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
    } catch (e: any) {
      Alert.alert('Алдаа', e.message);
    } finally {
      setRemoving(null);
    }
  };

  const renderItem = ({ item }: { item: Favorite }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => onNavigate('listingDetail', { listingId: item.listing_id })}
      activeOpacity={0.85}
    >
      <View style={s.cardImg}><Text style={{ fontSize: 32 }}>🏢</Text></View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>
          {item.title ?? `Байр #${item.listing_id}`}
        </Text>
        {item.address && <Text style={s.cardAddr} numberOfLines={1}>📍 {item.address}</Text>}
        {item.price && (
          <Text style={s.cardPrice}>{Number(item.price).toLocaleString()}₮ / сар</Text>
        )}
      </View>
      <TouchableOpacity
        style={s.removeBtn}
        onPress={() => handleRemove(item.listing_id)}
        disabled={removing === item.listing_id}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {removing === item.listing_id
          ? <ActivityIndicator size="small" color={Colors.red} />
          : <Text style={s.removeTxt}>❤️</Text>}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Хадгалсан байрнууд</Text>
        {favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{favorites.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => `${item.user_id}-${item.listing_id}`}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🤍</Text>
              <Text style={s.emptyTxt}>Хадгалсан байр байхгүй</Text>
              <Text style={s.emptySub}>Байрны зар дээр ❤️ дарж хадгалаарай</Text>
              <TouchableOpacity style={s.exploreBtn} onPress={() => onNavigate('home')}>
                <Text style={s.exploreTxt}>Байр хайх</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <BottomNav active="saved" onNavigate={(tab) => onNavigate(tab)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  countBadge:  { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt:    { fontSize: 12, fontWeight: '800', color: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { padding: 12, gap: 10 },
  card:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 12 },
  cardImg:   { width: 72, height: 72, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:  { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, lineHeight: 20 },
  cardAddr:  { fontSize: 12, color: Colors.textMuted },
  cardPrice: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  removeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeTxt: { fontSize: 22 },
  emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTxt:  { fontSize: 17, fontWeight: '800', color: Colors.text },
  emptySub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  exploreBtn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  exploreTxt: { color: Colors.white, fontWeight: '800', fontSize: 14 },
});
