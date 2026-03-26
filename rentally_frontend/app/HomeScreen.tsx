import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, RefreshControl, Dimensions,
  ActivityIndicator, FlatList, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { ListingAPI, FavoriteAPI, Category, Region, Listing, RegionAPI } from '../services/api';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.62;

interface Props {
  onNavigate: (tab: TabName) => void;
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
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  if (compact) {
    return (
      <View style={[s.skelCard, { width: CARD_W }]}>
        <Animated.View style={[s.skelImg, { opacity }]} />
        <View style={s.skelInfo}>
          <Animated.View style={[s.skelLine, { width: '80%', opacity }]} />
          <Animated.View style={[s.skelLine, { width: '55%', opacity }]} />
          <Animated.View style={[s.skelLineShort, { opacity }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={s.skelCardFull}>
      <Animated.View style={[s.skelImgFull, { opacity }]} />
      <View style={s.skelInfoFull}>
        <Animated.View style={[s.skelLine, { width: '90%', opacity }]} />
        <Animated.View style={[s.skelLine, { width: '65%', opacity }]} />
        <Animated.View style={[s.skelLineShort, { opacity }]} />
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) {
  return (
    <View style={s.secHeader}>
      <View>
        <Text style={s.secTitle}>{title}</Text>
        {subtitle ? <Text style={s.secSub}>{subtitle}</Text> : null}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={s.secAction}>
          <Text style={s.secActionTxt}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rowScroll}>
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
      contentContainerStyle={s.rowScroll}
      renderItem={({ item }) => (
        <ListingCard
          {...item}
          id={item.id}
          title={item.title}
          price={item.price}
          priceType={item.price_type}
          regionName={(item as any).region?.name}
          districtName={(item as any).region?.parent_name}
          imageUrl={(item as any).images?.[0]?.image_url}
          area={(item as any).details?.area_sqm}
          rooms={(item as any).details?.floor_number}
          rating={(item as any).rating_avg ?? null}
          reviewCount={(item as any).review_count}
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

// ─── Main screen ──────────────────────────────────────────────
export default function HomeScreen({ onNavigate, onOpenDetail }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [nearby, setNearby]         = useState<Listing[]>([]);
  const [popular, setPopular]       = useState<Listing[]>([]);
  const [newListings, setNewListings] = useState<Listing[]>([]);
  const [favorites, setFavorites]   = useState<Set<number>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ]       = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions]       = useState<Region[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [listRes, favRes, catRes, regRes] = await Promise.all([
        ListingAPI.list({ page_size: 20 }),
        FavoriteAPI.list(1),   // TODO: replace 1 with real user id
        CategoryAPI.list(),
        RegionAPI.list(),
      ]);

      const all: Listing[] = listRes.results ?? listRes;
      setNearby(all.slice(0, 6));
      setPopular(all.slice(6, 12));
      setNewListings(all.slice(12, 18));
      setCategories(catRes);
      setRegions(regRes);

      const favIds = new Set((favRes as any).results?.map((f: any) => f.listing_id) ?? []);
      setFavorites(favIds);
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => fetchData(true);

  const handleCardPress = (id: number) => {
    onOpenDetail?.(id);
  };

  const handleFavorite = async (id: number) => {
    try {
      if (favorites.has(id)) {
        await FavoriteAPI.remove(id, 1);
        setFavorites(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        await FavoriteAPI.add(1, id);
        setFavorites(prev => new Set(prev).add(id));
      }
    } catch (e) {
      console.error('Fav error:', e);
    }
  };

  const handleCategoryPress = (catId: number) => {
    // Navigate to map with category filter
    onNavigate('map');
  };

  const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    default: 'business-outline',
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top bar ─────────────────────────────────────── */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <Text style={s.logo}>БАЙ<Text style={s.logoAccent}>Р</Text></Text>
          <TouchableOpacity style={s.notifBtn} onPress={() => onNavigate('profile')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={s.searchBar} onPress={() => setSearchOpen(true)} activeOpacity={0.8}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <Text style={s.searchTxt}>Ямар байр хайж байна вэ?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Hero categories (horizontal) ────────────── */}
        <View style={s.catRow}>
          {categories.slice(0, 4).map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={s.catItem}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.8}
            >
              <View style={s.catCircle}>
                <Ionicons name={CATEGORY_ICONS.default} size={22} color={Colors.primary} />
              </View>
              <Text style={s.catLabel} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={s.catItem}
            onPress={() => onNavigate('map')}
            activeOpacity={0.8}
          >
            <View style={[s.catCircle, { backgroundColor: Colors.iconBg }]}>
              <Ionicons name="options-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={s.catLabel}>Бүгд</Text>
          </TouchableOpacity>
        </View>

        {/* ── Nearby for you ────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="👋 Ойрхон байрлал"
            subtitle="Таны хүсэлтэд тохирсон"
            action={{ label: 'Бүгд →', onPress: () => onNavigate('map') }}
          />
          <ListingRow
            listings={nearby}
            loading={loading}
            onCardPress={handleCardPress}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </View>

        {/* ── Popular this week ──────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="🔥 Өндөр эрэлттэй"
            subtitle="Идэвхтэй хайрлаж буй"
            action={{ label: 'Бүгд →', onPress: () => onNavigate('map') }}
          />
          <ListingRow
            listings={popular}
            loading={loading}
            onCardPress={handleCardPress}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </View>

        {/* ── Promo banner ──────────────────────────────── */}
        <TouchableOpacity style={s.promoBanner} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={s.promoTitle}>
              Хамгийн <Text style={s.promoHighlight}>хүсэмжтэй</Text> {'\n'}апартментийн брэнд?
            </Text>
            <Text style={s.promoSub}>Санал асуулгад оролцоод шагнал аваарай!</Text>
          </View>
          <View style={s.promoSticker}>
            <Text style={{ fontSize: 22 }}>☕</Text>
            <Text style={s.promoStickerTxt}>50,000₮</Text>
            <Text style={s.promoStickerMini}>2/2</Text>
          </View>
        </TouchableOpacity>

        {/* ── New listings ──────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="✨ Шинэ байрнууд"
            subtitle="Энэ долоо хоногт нэмэгдсэн"
          />
          <ListingRow
            listings={newListings}
            loading={loading}
            onCardPress={handleCardPress}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </View>

        {/* ── Districts quick access ───────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="🗺️ Дүүргээр хайх"
            subtitle="Улаанбаатар"
          />
          <View style={s.districtGrid}>
            {regions.filter(r => !r.parent_id).slice(0, 8).map(r => (
              <TouchableOpacity
                key={r.id}
                style={s.districtChip}
                onPress={() => onNavigate('map')}
                activeOpacity={0.8}
              >
                <Text style={s.districtChipTxt}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <BottomNav active="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // top bar
  topBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  logoAccent: { color: Colors.yellow },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    backgroundColor: Colors.bg,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchTxt: { fontSize: 14, color: Colors.textMuted },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12 },

  // categories
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  catItem: { alignItems: 'center', gap: 6, flex: 1 },
  catCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.iconBg,
    alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  // section
  section: { marginBottom: 24 },
  secHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  secTitle: { fontSize: 17, fontWeight: '900', color: Colors.text },
  secSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  secAction: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  secActionTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  rowScroll: { paddingHorizontal: 16, gap: 12 },

  // promo banner
  promoBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.darkBg,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoTitle: { fontSize: 17, fontWeight: '900', color: Colors.white, lineHeight: 26, marginBottom: 6 },
  promoHighlight: { color: '#60b4ff' },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  promoSticker: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginLeft: 14,
  },
  promoStickerTxt: { fontSize: 12, color: Colors.white, fontWeight: '800', marginTop: 3 },
  promoStickerMini: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // district grid
  districtGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  districtChip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  districtChipTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },

  // skeletons
  skelCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  skelImg: { height: 120, backgroundColor: '#e8eaf0', borderRadius: 0 },
  skelInfo: { padding: 10, gap: 6 },
  skelLine: { height: 12, backgroundColor: '#e8eaf0', borderRadius: 6 },
  skelLineShort: { height: 10, width: '40%', backgroundColor: '#e8eaf0', borderRadius: 6 },
  skelCardFull: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  skelImgFull: { height: 160, backgroundColor: '#e8eaf0' },
  skelInfoFull: { padding: 14, gap: 6 },
});
