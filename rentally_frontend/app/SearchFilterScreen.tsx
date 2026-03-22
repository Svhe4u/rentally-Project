import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { CategoryAPI, RegionAPI, Category, Region } from '../services/api';

interface Props { onNavigate: (screen: string, params?: any) => void; }

const PRICE_TYPES = ['monthly', 'daily', 'yearly', 'total'];
const PRICE_LABELS: Record<string, string> = {
  monthly: 'Сарын түрээс', daily: 'Өдрийн', yearly: 'Жилийн', total: 'Нийт худалдах',
};

export default function SearchFilterScreen({ onNavigate }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions]       = useState<Region[]>([]);
  const [loading, setLoading]       = useState(true);

  const [keyword, setKeyword]     = useState('');
  const [category, setCategory]   = useState('');
  const [priceType, setPriceType] = useState('');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [region, setRegion]       = useState('');
  const [minArea, setMinArea]     = useState('');
  const [maxArea, setMaxArea]     = useState('');

  useEffect(() => {
    Promise.all([CategoryAPI.list(), RegionAPI.list()])
      .then(([cats, regs]) => { setCategories(cats); setRegions(regs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCount = [category, priceType, region, minPrice, maxPrice, minArea, maxArea]
    .filter(Boolean).length;

  const resetAll = () => {
    setKeyword(''); setCategory(''); setPriceType('');
    setMinPrice(''); setMaxPrice(''); setRegion('');
    setMinArea(''); setMaxArea('');
  };

  const applyFilters = () => {
    onNavigate('map', { search: keyword, category, region, min_price: minPrice, max_price: maxPrice, price_type: priceType });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('map')} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Хайлт / Шүүлтүүр</Text>
        {activeCount > 0
          ? <TouchableOpacity onPress={resetAll}><Text style={s.resetTxt}>Арилгах ({activeCount})</Text></TouchableOpacity>
          : <View style={{ width: 70 }} />}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

          {/* Keyword */}
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Хаяг, дүүрэг, байрны нэр..."
              placeholderTextColor={Colors.textLight}
              value={keyword}
              onChangeText={setKeyword}
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <Text style={s.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories from API */}
          <Text style={s.sectionTitle}>Байрны төрөл</Text>
          <View style={s.chipRow}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, category === String(c.id) && s.chipOn]}
                onPress={() => setCategory(category === String(c.id) ? '' : String(c.id))}
                activeOpacity={0.8}
              >
                <Text style={[s.chipTxt, category === String(c.id) && s.chipTxtOn]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price type */}
          <Text style={s.sectionTitle}>Гэрээний төрөл</Text>
          <View style={s.chipRow}>
            {PRICE_TYPES.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.chip, priceType === p && s.chipOn]}
                onPress={() => setPriceType(priceType === p ? '' : p)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipTxt, priceType === p && s.chipTxtOn]}>{PRICE_LABELS[p]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price range */}
          <Text style={s.sectionTitle}>Үнийн хязгаар (₮)</Text>
          <View style={s.rangeRow}>
            <TextInput style={s.rangeInput} placeholder="Доод үнэ" placeholderTextColor={Colors.textLight}
              value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
            <Text style={s.dash}>–</Text>
            <TextInput style={s.rangeInput} placeholder="Дээд үнэ" placeholderTextColor={Colors.textLight}
              value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
          </View>

          {/* Regions from API — show only parent regions (no parent_id) */}
          <Text style={s.sectionTitle}>Дүүрэг</Text>
          <View style={s.chipRow}>
            {regions.filter(r => !r.parent_id).map(r => (
              <TouchableOpacity
                key={r.id}
                style={[s.chip, region === String(r.id) && s.chipOn]}
                onPress={() => setRegion(region === String(r.id) ? '' : String(r.id))}
                activeOpacity={0.8}
              >
                <Text style={[s.chipTxt, region === String(r.id) && s.chipTxtOn]}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Area range */}
          <Text style={s.sectionTitle}>Талбай (м²)</Text>
          <View style={s.rangeRow}>
            <TextInput style={s.rangeInput} placeholder="Доод м²" placeholderTextColor={Colors.textLight}
              value={minArea} onChangeText={setMinArea} keyboardType="numeric" />
            <Text style={s.dash}>–</Text>
            <TextInput style={s.rangeInput} placeholder="Дээд м²" placeholderTextColor={Colors.textLight}
              value={maxArea} onChangeText={setMaxArea} keyboardType="numeric" />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <View style={s.footer}>
        <TouchableOpacity style={s.btnApply} onPress={applyFilters} activeOpacity={0.85}>
          <Text style={s.btnApplyTxt}>Хайлт хийх</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  resetTxt: { fontSize: 13, color: Colors.red, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 20 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  clearIcon: { fontSize: 14, color: Colors.textLight },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:    { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: Colors.white },
  chipOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTxtOn: { color: Colors.white, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  rangeInput: { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, color: Colors.text, backgroundColor: '#fafafa' },
  dash:    { fontSize: 16, color: Colors.textLight, fontWeight: '600' },
  footer:  { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  btnApply: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnApplyTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
