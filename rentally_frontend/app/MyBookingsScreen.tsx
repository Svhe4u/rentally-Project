import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import {
  ArrowLeft, Calendar, Clock, MapPin, ChevronRight,
  CheckCircle2, XCircle, Loader2, AlertCircle, Package,
  Filter
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { BookingAPI } from '../services/api';
import type { Booking } from '../services/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

interface BookingExtended extends Booking {
  listing_title?: string;
  user_username?: string;
  duration_days?: number;
  days_remaining?: number;
  notes?: string;
  listing?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:     { label: 'Хүлээгдэж буй', color: 'text-amber-600',  bg: 'bg-amber-50',   icon: Clock },
  confirmed:   { label: 'Баталгаажсан',  color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: CheckCircle2 },
  checked_in:  { label: 'Амьдарч байна', color: 'text-blue-600',   bg: 'bg-blue-50',     icon: MapPin },
  checked_out: { label: 'Дууссан',       color: 'text-slate-500',  bg: 'bg-slate-100',   icon: Package },
  cancelled:   { label: 'Цуцлагдсан',   color: 'text-red-500',    bg: 'bg-red-50',      icon: XCircle },
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',         label: 'Бүгд' },
  { key: 'pending',     label: 'Хүлээгдэж буй' },
  { key: 'confirmed',   label: 'Баталгаажсан' },
  { key: 'checked_in',  label: 'Амьдарч буй' },
  { key: 'cancelled',   label: 'Цуцлагдсан' },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${d.getFullYear()}.${month < 10 ? '0' + month : month}.${day < 10 ? '0' + day : day}`;
  } catch {
    return dateStr;
  }
}

function formatPrice(price?: number): string {
  if (!price) return '—';
  return price.toLocaleString() + '₮';
}

function BookingCard({ booking, onPress }: { booking: BookingExtended; onPress: () => void }) {
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <TouchableOpacity
      className="mx-5 mb-4 bg-card border border-border rounded-[28px] overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-black text-foreground tracking-tight" numberOfLines={2}>
            {booking.listing_title || `Захиалга #${booking.id}`}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1.5">
            <Calendar size={13} className="text-muted-foreground" />
            <Text className="text-xs font-bold text-muted-foreground">
              Захиалга #{booking.id}
            </Text>
          </View>
        </View>
        <View className={cn('flex-row items-center gap-1.5 px-3 py-1.5 rounded-full', cfg.bg)}>
          <StatusIcon size={14} className={cfg.color} />
          <Text className={cn('text-[11px] font-black', cfg.color)}>{cfg.label}</Text>
        </View>
      </View>

      {/* Date Range */}
      <View className="mx-5 bg-secondary/50 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Эхлэх</Text>
            <Text className="text-sm font-black text-foreground">{formatDate(booking.start_date)}</Text>
          </View>
          <View className="px-3">
            <View className="w-8 h-[2px] bg-primary/30 rounded-full" />
          </View>
          <View className="flex-1 items-end">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Дуусах</Text>
            <Text className="text-sm font-black text-foreground">{formatDate(booking.end_date)}</Text>
          </View>
        </View>
        {booking.duration_days != null && booking.duration_days > 0 && (
          <View className="flex-row items-center justify-center mt-2.5 pt-2.5 border-t border-border/50">
            <Clock size={13} className="text-primary" />
            <Text className="text-xs font-bold text-primary ml-1.5">{booking.duration_days} хоног</Text>
            {booking.days_remaining != null && booking.days_remaining > 0 && (
              <Text className="text-xs font-bold text-muted-foreground ml-2">
                ({booking.days_remaining} хоног үлдсэн)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between px-5 pb-4 pt-1">
        <View>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Нийт төлбөр</Text>
          <Text className="text-lg font-black text-primary tracking-tight">{formatPrice(booking.total_price)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-bold text-muted-foreground">Дэлгэрэнгүй</Text>
          <ChevronRight size={16} className="text-muted-foreground/50" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyBookingsScreen({ onNavigate }: Props) {
  const [bookings, setBookings] = useState<BookingExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await BookingAPI.list() as any;
      // Backend returns { meta, results } paginated format
      const list = res?.results ?? res;
      setBookings(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Bookings fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const handleCancelBooking = (booking: BookingExtended) => {
    if (booking.status !== 'pending') {
      Alert.alert('Мэдэгдэл', 'Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой.');
      return;
    }
    Alert.alert(
      'Захиалга цуцлах',
      `#${booking.id} захиалгыг цуцлахдаа итгэлтэй байна уу?`,
      [
        { text: 'Буцах', style: 'cancel' },
        {
          text: 'Цуцлах',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookingAPI.update(booking.id, { status: 'cancelled' } as any);
              fetchBookings();
            } catch (e) {
              Alert.alert('Алдаа', 'Захиалга цуцлахад алдаа гарлаа');
            }
          }
        }
      ]
    );
  };

  const handleBookingPress = (booking: BookingExtended) => {
    Alert.alert(
      `Захиалга #${booking.id}`,
      `📍 ${booking.listing_title || 'Байр'}\n📅 ${formatDate(booking.start_date)} → ${formatDate(booking.end_date)}\n💰 ${formatPrice(booking.total_price)}\n📋 Төлөв: ${STATUS_CONFIG[booking.status]?.label || booking.status}${booking.notes ? '\n📝 ' + booking.notes : ''}`,
      [
        { text: 'Хаах', style: 'cancel' },
        ...(booking.status === 'pending' ? [{
          text: 'Цуцлах',
          style: 'destructive' as const,
          onPress: () => handleCancelBooking(booking),
        }] : []),
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center"
          onPress={() => onNavigate('profile')}
          activeOpacity={0.7}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-foreground tracking-tight uppercase">
          Миний захиалгууд
        </Text>
        <View className="w-11" />
      </View>

      {/* Filter Tabs */}
      <View className="px-5 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className={cn(
                'px-4 py-2.5 rounded-full border',
                filter === tab.key
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
              )}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text className={cn(
                'text-xs font-black',
                filter === tab.key ? 'text-white' : 'text-muted-foreground'
              )}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e55fa" />
          <Text className="text-sm font-bold text-muted-foreground mt-3">Ачаалж байна...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e55fa']} />
          }
        >
          {/* Summary */}
          <View className="mx-5 mb-5 flex-row items-center justify-between bg-card border border-border rounded-[24px] p-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                <Calendar size={20} className="text-primary" />
              </View>
              <View>
                <Text className="text-sm font-black text-foreground">
                  {filter === 'all' ? 'Нийт захиалга' : FILTER_TABS.find(t => t.key === filter)?.label}
                </Text>
                <Text className="text-xs font-bold text-muted-foreground">
                  {filteredBookings.length} захиалга
                </Text>
              </View>
            </View>
            <View className="bg-primary/10 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-black text-primary">{filteredBookings.length}</Text>
            </View>
          </View>

          {filteredBookings.length === 0 ? (
            <View className="items-center justify-center py-20 px-10">
              <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-5">
                <Calendar size={36} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-black text-foreground text-center mb-2">
                Захиалга байхгүй
              </Text>
              <Text className="text-sm font-medium text-muted-foreground text-center leading-5">
                {filter === 'all'
                  ? 'Та одоогоор захиалга хийгээгүй байна. Байр хайж захиалга хийнэ үү.'
                  : `"${FILTER_TABS.find(t => t.key === filter)?.label}" төлөвтэй захиалга байхгүй.`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  className="mt-6 bg-primary px-8 py-3.5 rounded-2xl"
                  onPress={() => onNavigate('home')}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-black text-sm">БАЙР ХАЙХ</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => handleBookingPress(booking)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
