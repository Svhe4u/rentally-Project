import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FavoriteAPI, Favorite, ListingAPI } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';
import ListingCard from '../components/ListingCard';

interface Props {
  onNavigate: (tab: TabName) => void;
  onOpenDetail: (id: number) => void;
  userId?: number;
}

interface FavoriteWithDetails extends Favorite {
  images?: { image_url: string }[];
  details?: { area_sqm?: number; floor_number?: number };
  rating_avg?: number | null;
  review_count?: number;
  region?: { name: string; parent_name?: string };
  price_type?: string;
}

export default function SavedScreen({ onNavigate, onOpenDetail, userId = 1 }: Props) {
  const [items, setItems]     = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const favData = await FavoriteAPI.list();
      const favs: Favorite[] = (favData as any).results ?? favData ?? [];

      // Enrich each favorite with full listing details
      const enriched = await Promise.allSettled(
        favs.map(f =>
          ListingAPI.detail(f.listing).catch(() => null)
        )
      );

      const enrichedItems: FavoriteWithDetails[] = enriched
        .map((r, i) => {
          if (r.status !== 'fulfilled' || !r.value) return null;
          const listing = r.value as any;
          return {
            id: favs[i].id,
            listing_id: favs[i].listing,
            title: listing.title,
            price: listing.price,
            price_type: listing.price_type,
            address: listing.address,
            images: listing.images ?? [],
            details: listing.details ?? {},
            rating_avg: listing.rating_avg,
            review_count: listing.review_count,
            region: listing.region,
          } as FavoriteWithDetails;
        })
        .filter(Boolean) as FavoriteWithDetails[];

      setItems(enrichedItems);
    } catch {
      Alert.alert('Алдаа', 'Хадгалсан байрнуудыг ачаалж чадсангүй');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id: number) => {
    setRemoving(id);
    try {
      await FavoriteAPI.remove(id);
      setItems(prev => prev.filter(f => f.listing_id !== id));
    } catch (e: any) {
      Alert.alert('Алдаа', e.message);
    } finally {
      setRemoving(null);
    }
  };

  const renderItem = ({ item }: { item: FavoriteWithDetails }) => (
    <View style={s.cardWrap}>
      <ListingCard
        id={item.listing_id}
        title={item.title ?? `Байр #${item.listing_id}`}
        price={item.price ?? 0}
        priceType={item.price_type ?? 'monthly'}
        address={item.address}
        regionName={item.region?.name}
        districtName={item.region?.parent_name}
        imageUrl={item.images?.[0]?.image_url}
        area={item.details?.area_sqm}
        rooms={item.details?.floor_number}
        rating={item.rating_avg ?? null}
        reviewCount={item.review_count}
        isFavorite={true}
        onPress={(id) => onOpenDetail(id)}
        onFavorite={(id) => handleRemove(id)}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.logo}>РЕНТАЛ<Text style={s.logoAccent}>ЛИ</Text></Text>
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{items.length}</Text>
        </View>
      </View>

      <View style={s.pageHeader}>
        <Text style={s.headerTitle}>Хадгалсан</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadingTxt}>Уншиж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.listing_id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="heart-dislike-outline" size={64} color="#ddd" />
              <Text style={s.emptyTxt}>Хадгалсан байр байхгүй</Text>
              <Text style={s.emptySub}>Байрны зар дээр ❤️ дарж хадгалаарай</Text>
            </View>
          }
        />
      )}

      <BottomNav active="saved" onNavigate={onNavigate} />
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
  pageHeader: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  countBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12,
  },
  countTxt: { fontSize: 13, fontWeight: 'bold', color: Colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  list: { padding: 12, gap: 0 },
  cardWrap: { marginBottom: 4 },
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 100, paddingHorizontal: 32, gap: 12,
  },
  emptyTxt:  { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
