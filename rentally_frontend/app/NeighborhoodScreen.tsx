import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { MongoliaAPI } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (screen: string | TabName, params?: any) => void;
}

interface Neighborhood {
  name: string;
  district?: string;
  avg_price?: number;
  listing_count?: number;
  description?: string;
  tags?: string[];
}

interface PopularArea {
  name: string;
  region?: string;
  score?: number;
  avg_price?: number;
}

const FALLBACK_NEIGHBORHOODS: Neighborhood[] = [
  { name: 'Баянгол', district: 'Баянгол дүүрэг', avg_price: 750000, listing_count: 142, tags: ['Тайван', 'Метро ойр'] },
  { name: 'Сүхбаатар', district: 'Сүхбаатар дүүрэг', avg_price: 950000, listing_count: 98, tags: ['Хотын төв', 'Дэд бүтэц'] },
  { name: 'Хан-Уул', district: 'Хан-Уул дүүрэг', avg_price: 680000, listing_count: 76, tags: ['Байгаль ойр', 'Тайван'] },
  { name: 'Чингэлтэй', district: 'Чингэлтэй дүүрэг', avg_price: 820000, listing_count: 115, tags: ['Оффис олон', 'Хоол хүнс'] },
  { name: 'Баянзүрх', district: 'Баянзүрх дүүрэг', avg_price: 600000, listing_count: 189, tags: ['Хямд', 'Олон байр'] },
  { name: 'Сонгинохайрхан', district: 'Сонгинохайрхан дүүрэг', avg_price: 520000, listing_count: 234, tags: ['Хямд', 'Шинэ байр'] },
];

export default function NeighborhoodScreen({ onNavigate }: Props) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [popularAreas, setPopularAreas]   = useState<PopularArea[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState<Neighborhood | null>(null);

  useEffect(() => {
    Promise.all([MongoliaAPI.neighborhoods(), MongoliaAPI.popularAreas()])
      .then(([n, p]) => {
        setNeighborhoods(Array.isArray(n) && n.length ? n : FALLBACK_NEIGHBORHOODS);
        setPopularAreas(Array.isArray(p) ? p : []);
      })
      .catch(() => setNeighborhoods(FALLBACK_NEIGHBORHOODS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        <BottomNav active="community" onNavigate={(tab) => onNavigate(tab)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Дүүргийн мэдээлэл</Text>
        <Text style={s.headerSub}>Улаанбаатар хот</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Popular areas horizontal scroll */}
        {popularAreas.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Эрэлттэй хороолол</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.popularScroll}>
              {popularAreas.map((area, i) => (
                <View key={i} style={s.popularCard}>
                  <Text style={s.popularIcon}>📍</Text>
                  <Text style={s.popularName}>{area.name}</Text>
                  {area.avg_price && (
                    <Text style={s.popularPrice}>{Number(area.avg_price).toLocaleString()}₮</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Neighborhood grid */}
        <Text style={s.sectionTitle}>Бүх дүүрэг</Text>
        <View style={s.grid}>
          {neighborhoods.map((n, i) => (
            <TouchableOpacity
              key={i}
              style={[s.neighborCard, selected?.name === n.name && s.neighborCardOn]}
              onPress={() => setSelected(selected?.name === n.name ? null : n)}
              activeOpacity={0.85}
            >
              <View style={s.neighborTop}>
                <Text style={s.neighborName}>{n.name}</Text>
                {n.listing_count && (
                  <View style={s.countBadge}>
                    <Text style={s.countTxt}>{n.listing_count} зар</Text>
                  </View>
                )}
              </View>
              {n.district && <Text style={s.neighborDistrict}>{n.district}</Text>}
              {n.avg_price && (
                <Text style={s.neighborPrice}>~{Number(n.avg_price).toLocaleString()}₮ / сар</Text>
              )}
              {n.tags && (
                <View style={s.tagRow}>
                  {n.tags.map(t => (
                    <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
                  ))}
                </View>
              )}

              {/* Expanded detail */}
              {selected?.name === n.name && (
                <View style={s.expandedBox}>
                  {n.description && <Text style={s.expandedDesc}>{n.description}</Text>}
                  <TouchableOpacity
                    style={s.searchBtn}
                    onPress={() => onNavigate('map', { district: n.name })}
                    activeOpacity={0.85}
                  >
                    <Text style={s.searchBtnTxt}>{n.name} дүүргийн байр харах →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Price comparison */}
        <Text style={s.sectionTitle}>Дүүргийн үнийн харьцуулалт</Text>
        <View style={s.priceChart}>
          {[...neighborhoods]
            .sort((a, b) => (b.avg_price ?? 0) - (a.avg_price ?? 0))
            .map((n, i) => {
              const maxPrice = Math.max(...neighborhoods.map(nb => nb.avg_price ?? 0));
              const pct = maxPrice > 0 ? ((n.avg_price ?? 0) / maxPrice) * 100 : 0;
              return (
                <View key={i} style={s.barRow}>
                  <Text style={s.barLabel}>{n.name}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={s.barPrice}>
                    {n.avg_price ? `${(n.avg_price / 1000).toFixed(0)}к` : '–'}₮
                  </Text>
                </View>
              );
            })}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomNav active="community" onNavigate={(tab) => onNavigate(tab)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  headerSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  content: { padding: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10, marginTop: 4 },
  popularScroll: { marginBottom: 20 },
  popularCard: { width: 130, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginRight: 10, gap: 4 },
  popularIcon:  { fontSize: 24 },
  popularName:  { fontSize: 13, fontWeight: '800', color: Colors.text },
  popularPrice: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  grid: { gap: 10, marginBottom: 20 },
  neighborCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: 'transparent' },
  neighborCardOn: { borderColor: Colors.primary },
  neighborTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  neighborName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  countBadge:   { backgroundColor: Colors.iconBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  countTxt:     { fontSize: 11, fontWeight: '700', color: Colors.primary },
  neighborDistrict: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  neighborPrice:    { fontSize: 14, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:    { backgroundColor: Colors.bg, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  tagTxt: { fontSize: 11, fontWeight: '600', color: '#555' },
  expandedBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  expandedDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  searchBtnTxt: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  priceChart: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, gap: 12, marginBottom: 8 },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 90, fontSize: 12, fontWeight: '700', color: Colors.text },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.bg, borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barPrice: { width: 46, fontSize: 11, fontWeight: '700', color: Colors.textMuted, textAlign: 'right' },
});
