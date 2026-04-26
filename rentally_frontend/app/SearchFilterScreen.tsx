import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { 
  ChevronLeft, 
  X, 
  RotateCcw, 
  Search, 
  Home, 
  DollarSign, 
  MapPin, 
  Maximize,
  Briefcase,
  Calendar,
  Clock
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { CategoryAPI, RegionAPI, Category, Region } from '../services/api';
import { cn } from '../utils/cn';

interface Props { onNavigate: (screen: string, params?: any) => void; }

const PRICE_TYPES = ['monthly', 'daily', 'yearly'];
const PRICE_LABELS: Record<string, string> = {
  monthly: 'Сараар', daily: 'Өдрөөр', yearly: 'Жилээр',
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
      .catch((e) => console.error('Filter load error:', e))
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
    onNavigate('map', { 
      search: keyword, 
      category, 
      region, 
      min_price: minPrice, 
      max_price: maxPrice, 
      price_type: priceType,
      min_area: minArea,
      max_area: maxArea
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-card border-b border-border">
        <TouchableOpacity 
          onPress={() => onNavigate('map')}
          className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        
        <Text className="text-base font-black uppercase tracking-widest text-foreground">Шүүлтүүр</Text>
        
        {activeCount > 0 ? (
          <TouchableOpacity onPress={resetAll} className="flex-row items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full">
            <RotateCcw size={12} className="text-red-500" />
            <Text className="text-[10px] font-black text-red-500 uppercase">{activeCount}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerClassName="p-6 gap-6">

            {/* Search Box */}
          <View className="bg-card border border-border rounded-[32px] p-5 shadow-sm">
             <View className="flex-row items-center bg-secondary/50 rounded-2xl px-4 py-3 gap-3">
               <Search size={18} className="text-muted-foreground" />
               <TextInput
                 className="flex-1 text-sm font-bold text-foreground h-10"
                 placeholder="Байрны нэр, хаяг..."
                 placeholderTextColor="#94a3b8"
                 value={keyword}
                 onChangeText={setKeyword}
               />
               {keyword.length > 0 && (
                 <TouchableOpacity onPress={() => setKeyword('')}>
                    <X size={16} className="text-muted-foreground" />
                 </TouchableOpacity>
               )}
             </View>
          </View>

          {/* Categories */}
          <Section icon={Home} title="Байрны төрөл">
            <View className="flex-row flex-wrap gap-2">
              {categories.map(c => (
                <Chip 
                  key={c.id} 
                  label={c.name} 
                  active={category === String(c.id)} 
                  onPress={() => setCategory(category === String(c.id) ? '' : String(c.id))} 
                />
              ))}
            </View>
          </Section>

          {/* Price types */}
          <Section icon={Calendar} title="Гэрээний төрөл">
            <View className="flex-row flex-wrap gap-2">
              {PRICE_TYPES.map(p => (
                <Chip 
                  key={p} 
                  label={PRICE_LABELS[p]} 
                  active={priceType === p} 
                  onPress={() => setPriceType(priceType === p ? '' : p)} 
                />
              ))}
            </View>
          </Section>

          {/* Price range */}
          <Section icon={DollarSign} title="Үнийн хязгаар (₮)">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 bg-secondary/50 rounded-2xl px-4 h-14 justify-center">
                <TextInput className="text-sm font-bold text-foreground" placeholder="Доод үнэ" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
              </View>
              <Text className="text-muted-foreground font-bold">-</Text>
              <View className="flex-1 bg-secondary/50 rounded-2xl px-4 h-14 justify-center">
                <TextInput className="text-sm font-bold text-foreground" placeholder="Дээд үнэ" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
              </View>
            </View>
          </Section>

          {/* Regions */}
          <Section icon={MapPin} title="Дүүрэг">
            <View className="flex-row flex-wrap gap-2">
              {regions.filter(r => !r.parent_id).map(r => (
                <Chip 
                  key={r.id} 
                  label={r.name} 
                  active={region === String(r.id)} 
                  onPress={() => setRegion(region === String(r.id) ? '' : String(r.id))} 
                />
              ))}
            </View>
          </Section>

          {/* Area */}
          <Section icon={Maximize} title="Талбай (м²)">
             <View className="flex-row items-center gap-3">
               <View className="flex-1 bg-secondary/50 rounded-2xl px-4 h-14 justify-center">
                 <TextInput className="text-sm font-bold text-foreground" placeholder="Доод м²" keyboardType="numeric" value={minArea} onChangeText={setMinArea} />
               </View>
               <Text className="text-muted-foreground font-bold">-</Text>
               <View className="flex-1 bg-secondary/50 rounded-2xl px-4 h-14 justify-center">
                 <TextInput className="text-sm font-bold text-foreground" placeholder="Дээд м²" keyboardType="numeric" value={maxArea} onChangeText={setMaxArea} />
               </View>
             </View>
          </Section>

          </ScrollView>
      )}

      {/* Footer */}
      <View className="p-6 bg-card border-t border-border">
         <TouchableOpacity 
           onPress={applyFilters}
           activeOpacity={0.8}
           className="bg-primary h-16 rounded-3xl items-center justify-center shadow-lg shadow-primary/20"
         >
           <Text className="text-white font-black text-base uppercase tracking-widest">Шүүлт хэрэглэх</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <View className="bg-card border border-border rounded-[32px] p-6 shadow-sm shadow-black/5">
      <View className="flex-row items-center gap-2 mb-4">
        <Icon size={16} className="text-primary" />
        <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={cn(
        "px-5 py-2.5 rounded-2xl border transition-all",
        active ? "bg-primary border-primary" : "bg-secondary/50 border-transparent"
      )}
    >
      <Text className={cn(
        "text-xs font-bold",
        active ? "text-white" : "text-foreground"
      )}>{label}</Text>
    </TouchableOpacity>
  );
}
