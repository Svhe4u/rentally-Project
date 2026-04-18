import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => onNavigate('map')} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Шүүлтүүр</Text>
        {activeCount > 0 ? (
          <TouchableOpacity onPress={resetAll} style={s.resetBtn}>
            <Text style={s.resetTxt}>Арилгах ({activeCount})</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

          {/* Search Card */}
          <View style={s.card}>
            <View style={s.searchBar}>
              <Ionicons name="search" size={18} color={Colors.textLight} />
              <TextInput
                style={s.searchInput}
                placeholder="Хаяг, дүүрэг, байрны нэр..."
                placeholderTextColor={Colors.textLight}
                value={keyword}
                onChangeText={setKeyword}
              />
              {keyword.length > 0 && (
                <TouchableOpacity onPress={() => setKeyword('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Categories from API */}
          <View style={s.card}>
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
          </View>

          {/* Price type */}
          <View style={s.card}>
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
          </View>

          {/* Price range */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Үнийн хязгаар (₮)</Text>
            <View style={s.rangeRow}>
              <View style={s.rangeInputWrap}>
                <TextInput style={s.rangeInput} placeholder="Доод үнэ" placeholderTextColor={Colors.textLight}
                  value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
              </View>
              <Text style={s.dash}>–</Text>
              <View style={s.rangeInputWrap}>
                <TextInput style={s.rangeInput} placeholder="Дээд үнэ" placeholderTextColor={Colors.textLight}
                  value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* Regions from API */}
          <View style={s.card}>
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
          </View>

          {/* Area range */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Талбай (м²)</Text>
            <View style={s.rangeRow}>
              <View style={s.rangeInputWrap}>
                <TextInput style={s.rangeInput} placeholder="Доод м²" placeholderTextColor={Colors.textLight}
                  value={minArea} onChangeText={setMinArea} keyboardType="numeric" />
              </View>
              <Text style={s.dash}>–</Text>
              <View style={s.rangeInputWrap}>
                <TextInput style={s.rangeInput} placeholder="Дээд м²" placeholderTextColor={Colors.textLight}
                  value={maxArea} onChangeText={setMaxArea} keyboardType="numeric" />
              </View>
            </View>
          </View>

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
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: Colors.red + '10' },
  resetTxt: { fontSize: 12, color: Colors.red, fontWeight: '700' },

  card: {
    marginHorizontal: 20, marginTop: 15,
    backgroundColor: Colors.white, borderRadius: 24, padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '600' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.textLight, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.bg, borderWidth: 1, borderColor: 'transparent' },
  chipOn: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTxtOn: { color: Colors.primary, fontWeight: '700' },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangeInputWrap: { flex: 1, backgroundColor: Colors.bg, borderRadius: 16 },
  rangeInput: { paddingVertical: 12, paddingHorizontal: 15, fontSize: 14, color: Colors.text, fontWeight: '600' },
  dash: { fontSize: 18, color: Colors.textLight, fontWeight: '700' },

  footer: { 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  btnApply: { backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  btnApplyTxt: { fontSize: 16, fontWeight: 'bold', color: Colors.white, letterSpacing: 0.5 },
});
