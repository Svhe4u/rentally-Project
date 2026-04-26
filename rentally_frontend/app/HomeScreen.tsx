import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, RefreshControl, Dimensions,
  Animated, FlatList,
} from 'react-native';
import { 
  Bell, 
  Search, 
  ChevronRight, 
  LayoutGrid, 
  Home as HomeIcon, 
  Filter,
  Map,
  Sparkles,
  TrendingUp,
  MapPin
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { ListingAPI, FavoriteAPI, Category, Region, Listing, RegionAPI, CategoryAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.75;

interface Props {
  onNavigate: (tab: TabName, params?: any) => void;
  onOpenDetail?: (id: number) => void;
}

// ─── Skeleton card ────────────────────────────────────────────
function SkeletonCard({ compact }: { compact?: boolean }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <View className={cn('bg-card rounded-[32px] overflow-hidden mr-4', compact ? 'w-64' : 'w-full mb-4')}>
      <Animated.View style={{ opacity }} className={cn('bg-muted', compact ? 'h-40' : 'h-52')} />
      <View className="p-4 gap-2">
        <Animated.View style={{ opacity }} className="h-4 w-3/4 bg-muted rounded-full" />
        <Animated.View style={{ opacity }} className="h-3 w-1/2 bg-muted rounded-full" />
        <View className="flex-row gap-2 mt-2">
          <Animated.View style={{ opacity }} className="h-6 w-16 bg-muted rounded-full" />
          <Animated.View style={{ opacity }} className="h-6 w-16 bg-muted rounded-full" />
        </View>
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, subtitle, icon: Icon, action }: { title: string; subtitle?: string; icon?: any; action?: { label: string; onPress: () => void } }) {
  return (
    <View className="flex-row items-center justify-between px-5 mb-4">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          {Icon && <Icon size={18} className="text-primary" />}
          <Text className="text-xl font-black text-foreground tracking-tight">{title}</Text>
        </View>
        {subtitle && <Text className="text-sm font-medium text-muted-foreground mt-0.5">{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity 
          onPress={action.onPress} 
          className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
        >
          <Text className="text-xs font-bold text-primary mr-1">{action.label}</Text>
          <ChevronRight size={14} className="text-primary" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Horizontal listing scroll ────────────────────────────────
function ListingRow({
  listings, loading, onCardPress, onFavorite, favorites,
}: {
  listings: Listing[];
  loading: boolean;
  onCardPress: (id: number) => void;
  onFavorite: (id: number) => void;
  favorites: Set<number>;
}) {
  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5">
        {[0, 1, 2].map(i => <SkeletonCard key={i} compact />)}
      </ScrollView>
    );
  }
  if (listings.length === 0) return null;
  return (
    <FlatList
      horizontal
      data={listings}
      keyExtractor={item => String(item.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5"
      renderItem={({ item }) => (
        <ListingCard
          id={item.id}
          title={item.title}
          price={Number(item.price)}
          priceType={item.price_type}
          address={item.address}
          regionName={item.region_name}
          imageUrl={item.cover_image ?? item.images?.[0]?.image_url}
          area={item.area_sqm != null ? Number(item.area_sqm) : undefined}
          rooms={item.bedrooms != null ? Number(item.bedrooms) : undefined}
          isFavorite={favorites.has(item.id)}
          onPress={onCardPress}
          onFavorite={onFavorite}
          compact
          width={CARD_W}
        />
      )}
    />
  );
}

export default function HomeScreen({ onNavigate, onOpenDetail }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [nearby, setNearby]         = useState<Listing[]>([]);
  const [popular, setPopular]       = useState<Listing[]>([]);
  const [newListings, setNewListings] = useState<Listing[]>([]);
  const [favorites, setFavorites]   = useState<Set<number>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions]       = useState<Region[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [popRes, newRes, nearbyRes, favRes, catRes, regRes] = await Promise.all([
        ListingAPI.list({ page_size: 6, ordering: '-favorite_count' }),
        ListingAPI.list({ page_size: 6, ordering: '-created_at', created_after: lastWeek }),
        ListingAPI.list({ page_size: 6 }),
        FavoriteAPI.list().catch(() => ({ results: [] })),
        CategoryAPI.list(),
        RegionAPI.list(),
      ]);

      setPopular(popRes.results ?? []);
      setNewListings(newRes.results ?? []);
      setNearby(nearbyRes.results ?? []);
      setCategories(catRes);
      setRegions(regRes);

      const favRows = (favRes as any).results ?? favRes ?? [];
      const favIds = new Set((Array.isArray(favRows) ? favRows : []).map((f: any) => f.listing as number));
      setFavorites(favIds);
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavorite = async (id: number) => {
    try {
      if (favorites.has(id)) {
        await FavoriteAPI.remove(id);
        setFavorites(prev => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        });
      } else {
        await FavoriteAPI.toggle(id);
        setFavorites(prev => new Set(prev).add(id));
      }
    } catch (e) { console.error('Fav error:', e); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Top Bar */}
      <View className="bg-background px-5 py-4 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Тавтай морил</Text>
            <Text className="text-2xl font-black text-primary tracking-tight">РЕНТАЛ<Text className="text-amber-400">ЛИ</Text></Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 rounded-2xl bg-secondary items-center justify-center border border-border" 
            onPress={() => onNavigate('profile')}
          >
            <Bell size={22} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <TouchableOpacity 
          className="bg-secondary h-14 rounded-2xl px-5 flex-row items-center border border-border shadow-sm shadow-black/5" 
          onPress={() => onNavigate('search_filter')}
          activeOpacity={0.8}
        >
          <Search size={20} className="text-muted-foreground mr-3" />
          <Text className="text-sm font-medium text-muted-foreground flex-1">Ямар байр хайж байна вэ?</Text>
          <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
            <Filter size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerClassName="pt-2 pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />
        }
      >
        {/* Categories */}
        <View className="flex-row px-5 pb-6 gap-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-5">
            {categories.slice(0, 5).map(cat => (
              <TouchableOpacity
                key={cat.id}
                className="items-center justify-center bg-card border border-border rounded-2xl px-4 py-3 min-w-[100px]"
                onPress={() => onNavigate('map', { category: cat.id })}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2">
                  <HomeIcon size={20} className="text-primary" />
                </View>
                <Text className="text-xs font-bold text-foreground">{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="items-center justify-center bg-primary border border-primary rounded-2xl px-4 py-3 min-w-[100px]"
              onPress={() => onNavigate('map')}
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-2">
                <LayoutGrid size={20} color="white" />
              </View>
              <Text className="text-xs font-bold text-white">Бүгд</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* New properties */}
        <View className="mb-8">
          <SectionHeader
            title="Шинэ байрнууд"
            subtitle="Энэ долоо хоногт нэмэгдсэн"
            icon={Sparkles}
            action={{ label: 'Бүгд', onPress: () => onNavigate('map') }}
          />
          <ListingRow
            listings={newListings}
            loading={loading}
            onCardPress={onOpenDetail || (() => {})}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </View>

        {/* High demand */}
        <View className="mb-8">
          <SectionHeader
            title="Хамгийн их үзсэн"
            subtitle="Хүмүүсийн сонирхож буй байрнууд"
            icon={TrendingUp}
            action={{ label: 'Бүгд', onPress: () => onNavigate('map') }}
          />
          <ListingRow
            listings={popular}
            loading={loading}
            onCardPress={onOpenDetail || (() => {})}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </View>

        {/* Promo Banner */}
        <TouchableOpacity className="mx-5 mb-8 bg-slate-900 rounded-[32px] p-6 relative overflow-hidden" activeOpacity={0.9}>
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full" />
          <View className="z-10">
            <Badge label="Шинэ боломж" variant="default" className="mb-3 bg-amber-400" labelClasses="text-slate-900" />
            <Text className="text-2xl font-black text-white leading-tight mb-2">
              Хамгийн хүсэмжтэй{'\n'}апартментийн брэнд?
            </Text>
            <Text className="text-sm font-medium text-slate-400">Санал асуулгад оролцоод шагнал аваарай!</Text>
          </View>
        </TouchableOpacity>

        {/* Districts */}
        <View className="mb-0">
          <SectionHeader
            title="Дүүргээр хайх"
            subtitle="Улаанбаатар хот"
            icon={Map}
          />
          <View className="flex-row flex-wrap px-5 gap-2">
            {regions.filter(r => !r.parent_id).slice(0, 9).map(r => (
              <TouchableOpacity
                key={r.id}
                className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center"
                onPress={() => onNavigate('map', { region: r.id })}
              >
                <MapPin size={14} className="text-primary mr-2" />
                <Text className="text-sm font-bold text-foreground">{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}
