import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, SafeAreaView,
  ActivityIndicator, Alert, RefreshControl, TouchableOpacity
} from 'react-native';
import { HeartOff, Bell } from 'lucide-react-native';
import { FavoriteAPI, Favorite, ListingAPI } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { Colors } from '../constants/colors';

interface Props {
  onNavigate: (tab: TabName) => void;
  onOpenDetail: (id: number) => void;
  userId?: number;
}

interface FavoriteWithDetails {
  id: number;
  listing: number;
  listing_id: number;
  created_at?: string;
  title?: string;
  price?: number;
  price_type?: string;
  address?: string;
  images?: { image_url: string }[];
  details?: { area_sqm?: number; floor_number?: number; bedrooms?: number };
  rating_avg?: number | null;
  review_count?: number;
  region_name?: string;
}

export default function SavedScreen({ onNavigate, onOpenDetail }: Props) {
  const [items, setItems]     = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const favData = await FavoriteAPI.list();
      const favs: Favorite[] = (favData as any).results ?? favData ?? [];

      const enriched = await Promise.allSettled(
        favs.map(f => ListingAPI.detail(f.listing).catch(() => null))
      );

      const enrichedItems: FavoriteWithDetails[] = enriched
        .map((r, i) => {
          if (r.status !== 'fulfilled' || !r.value) return null;
          const listing = r.value as any;
          return {
            id: favs[i].id,
            listing: favs[i].listing,
            listing_id: favs[i].listing,
            created_at: favs[i].created_at,
            title: listing.title,
            price: listing.price,
            price_type: listing.price_type,
            address: listing.address,
            images: listing.images ?? [],
            details: listing.detail ?? listing.details ?? {},
            rating_avg: listing.average_rating ?? listing.rating_avg,
            review_count: listing.review_count,
            region_name: listing.region_name,
          };
        })
        .filter(Boolean) as FavoriteWithDetails[];

      setItems(enrichedItems);
    } catch {
      Alert.alert('Алдаа', 'Хадгалсан байрнуудыг ачаалж чадсангүй');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id: number) => {
    try {
      await FavoriteAPI.remove(id);
      setItems(prev => prev.filter(f => f.listing_id !== id));
    } catch (e: any) {
      Alert.alert('Алдаа', e.message);
    }
  };

  const renderItem = ({ item }: { item: FavoriteWithDetails }) => (
    <View className="px-5 mb-5">
      <ListingCard
        id={item.listing_id}
        title={item.title ?? `Байр #${item.listing_id}`}
        price={Number(item.price ?? 0)}
        priceType={item.price_type ?? 'monthly'}
        address={item.address}
        regionName={item.region_name}
        imageUrl={item.images?.[0]?.image_url}
        area={item.details?.area_sqm != null ? Number(item.details.area_sqm) : undefined}
        rooms={item.details?.bedrooms != null ? Number(item.details.bedrooms) : undefined}
        rating={item.rating_avg ?? null}
        reviewCount={item.review_count}
        isFavorite={true}
        onPress={(id) => onOpenDetail(id)}
        onFavorite={(id) => handleRemove(id)}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Top Bar */}
      <View className="bg-background px-5 py-4 border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-primary tracking-tight">РЕНТАЛ<Text className="text-amber-400">ЛИ</Text></Text>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Таны хадгалсан байрнууд</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="bg-primary/10 px-3 py-1.5 rounded-full">
            <Text className="text-xs font-black text-primary">{items.length} байр</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="mt-4 text-sm font-bold text-muted-foreground">Ачаалж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.listing_id)}
          renderItem={renderItem}
          className="flex-1"
          contentContainerClassName="pt-5 pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center pt-24 px-10 gap-4">
              <View className="w-20 h-20 bg-muted rounded-full items-center justify-center">
                <HeartOff size={40} className="text-muted-foreground/30" />
              </View>
              <Text className="text-lg font-black text-foreground text-center">Хадгалсан байр байхгүй</Text>
              <Text className="text-sm font-medium text-muted-foreground text-center">
                Байрны зар дээр зүрх дарж хадгалснаар энд гарч ирэх болно.
              </Text>
              <TouchableOpacity 
                className="mt-4 bg-primary px-8 py-4 rounded-2xl"
                onPress={() => onNavigate('home')}
              >
                <Text className="text-white font-black">Байр хайх</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <BottomNav active="saved" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}
