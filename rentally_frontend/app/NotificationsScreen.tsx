import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import {
  ArrowLeft, Bell, BellOff, Calendar, CheckCircle2, XCircle,
  Clock, MapPin, Package, ChevronRight, Trash2, AlertCircle,
} from 'lucide-react-native';
import { cn } from '../utils/cn';
import { BookingAPI, MessageThreadAPI } from '../services/api';
import type { Booking } from '../services/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

type NotifType = 'booking' | 'message' | 'system';

interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  status?: string;
  isRead: boolean;
  bookingId?: number;
  listingId?: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:     { label: 'Хүлээгдэж буй', color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
  confirmed:   { label: 'Баталгаажсан',  color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: CheckCircle2 },
  checked_in:  { label: 'Амьдарч байна', color: 'text-blue-600',   bg: 'bg-blue-50',     icon: MapPin },
  checked_out: { label: 'Дууссан',       color: 'text-slate-500',  bg: 'bg-slate-100',   icon: Package },
  cancelled:   { label: 'Цуцлагдсан',   color: 'text-red-500',    bg: 'bg-red-50',      icon: XCircle },
  completed:   { label: 'Дууссан',       color: 'text-primary',    bg: 'bg-primary/5',   icon: CheckCircle2 },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Дөнгөж сая';
    if (diffMin < 60) return `${diffMin} мин`;
    if (diffHr < 24) return `${diffHr} цагийн өмнө`;
    if (diffDay < 7) return `${diffDay} өдрийн өмнө`;
    return d.toLocaleDateString('mn-MN');
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function NotificationCard({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const cfg = item.status ? (STATUS_MAP[item.status] || STATUS_MAP.pending) : null;
  const StatusIcon = cfg?.icon || Bell;

  const iconBg = item.type === 'booking'
    ? (cfg?.bg || 'bg-primary/5')
    : item.type === 'message'
      ? 'bg-blue-50'
      : 'bg-secondary';

  const iconColor = item.type === 'booking'
    ? (cfg?.color || 'text-primary')
    : item.type === 'message'
      ? 'text-blue-500'
      : 'text-muted-foreground';

  return (
    <TouchableOpacity
      className={cn(
        'mx-5 mb-3 bg-card border rounded-[24px] overflow-hidden',
        item.isRead ? 'border-border' : 'border-primary/20'
      )}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
      }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row p-4 gap-3.5">
        {/* Icon */}
        <View className={cn('w-11 h-11 rounded-[14px] items-center justify-center flex-shrink-0', iconBg)}>
          <StatusIcon size={20} className={iconColor} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <Text className={cn(
              'text-sm flex-1 pr-2 tracking-tight',
              item.isRead ? 'font-bold text-foreground' : 'font-black text-foreground'
            )} numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-[10px] font-bold text-muted-foreground flex-shrink-0 mt-0.5">
              {formatRelativeTime(item.time)}
            </Text>
          </View>

          <Text className="text-xs font-medium text-muted-foreground leading-[18px] mb-2" numberOfLines={2}>
            {item.body}
          </Text>

          {/* Status badge for bookings */}
          {cfg && item.status && (
            <View className="flex-row items-center gap-3">
              <View className={cn('flex-row items-center gap-1 px-2.5 py-1 rounded-full', cfg.bg)}>
                <StatusIcon size={12} className={cfg.color} />
                <Text className={cn('text-[10px] font-black', cfg.color)}>{cfg.label}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Unread dot */}
        {!item.isRead && (
          <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ onNavigate }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'booking' | 'message'>('all');

  const loadNotifications = useCallback(async () => {
    try {
      // Fetch bookings and messages in parallel
      const [bookingsRes, messagesRes] = await Promise.allSettled([
        BookingAPI.list(),
        MessageThreadAPI.list(),
      ]);

      const notifs: NotificationItem[] = [];

      // Convert bookings to notifications
      if (bookingsRes.status === 'fulfilled') {
        const bookingsData = bookingsRes.value as any;
        const bookings: Booking[] = bookingsData?.results ?? bookingsData;
        if (Array.isArray(bookings)) {
          bookings.forEach((b) => {
            const statusCfg = STATUS_MAP[b.status] || STATUS_MAP.pending;
            notifs.push({
              id: `booking-${b.id}`,
              type: 'booking',
              title: b.listing_title
                ? `"${b.listing_title}" захиалга`
                : `Захиалга #${b.id}`,
              body: `${formatDate(b.start_date)} → ${formatDate(b.end_date)}${b.total_price ? ' · ' + Number(b.total_price).toLocaleString() + '₮' : ''}`,
              time: b.created_at,
              status: b.status,
              isRead: b.status !== 'pending',
              bookingId: b.id,
              listingId: b.listing_id || b.listing,
            });
          });
        }
      }

      // Convert message threads to notifications
      if (messagesRes.status === 'fulfilled') {
        const msgData = messagesRes.value as any;
        const conversations = msgData?.conversations ?? [];
        if (Array.isArray(conversations)) {
          conversations.forEach((conv: any) => {
            if (conv.unread_count > 0) {
              notifs.push({
                id: `msg-${conv.partner_id}`,
                type: 'message',
                title: `${conv.partner_name || 'Хэрэглэгч'}-аас мессеж`,
                body: conv.last_message_text || 'Шинэ мессеж ирлээ',
                time: conv.last_message_created,
                isRead: false,
              });
            }
          });
        }
      }

      // Sort by time (newest first)
      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(notifs);
    } catch (e) {
      console.error('Notifications load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const filteredNotifs = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotifPress = (item: NotificationItem) => {
    if (item.type === 'booking' && item.listingId) {
      onNavigate('myBookings');
    } else if (item.type === 'message') {
      onNavigate('messages');
    }
  };

  const FILTER_TABS = [
    { key: 'all' as const, label: 'Бүгд', count: notifications.length },
    { key: 'booking' as const, label: 'Захиалга', count: notifications.filter(n => n.type === 'booking').length },
    { key: 'message' as const, label: 'Мессеж', count: notifications.filter(n => n.type === 'message').length },
  ];

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

        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-black text-foreground tracking-tight uppercase">
            Мэдэгдэл
          </Text>
          {unreadCount > 0 && (
            <View className="bg-primary min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5">
              <Text className="text-[10px] font-black text-white">{unreadCount}</Text>
            </View>
          )}
        </View>

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
                'flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border',
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
              {tab.count > 0 && (
                <View className={cn(
                  'min-w-[18px] h-[18px] rounded-full items-center justify-center px-1',
                  filter === tab.key ? 'bg-white/20' : 'bg-secondary'
                )}>
                  <Text className={cn(
                    'text-[9px] font-black',
                    filter === tab.key ? 'text-white' : 'text-muted-foreground'
                  )}>
                    {tab.count}
                  </Text>
                </View>
              )}
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
          {/* Today / Recent header */}
          {filteredNotifs.length > 0 && (
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px]">
                Сүүлийн мэдэгдлүүд
              </Text>
              <Text className="text-[11px] font-bold text-muted-foreground">
                {filteredNotifs.length} мэдэгдэл
              </Text>
            </View>
          )}

          {filteredNotifs.length === 0 ? (
            <View className="items-center justify-center py-24 px-10">
              <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center mb-6">
                <BellOff size={40} className="text-muted-foreground" />
              </View>
              <Text className="text-xl font-black text-foreground text-center mb-2">
                Мэдэгдэл байхгүй
              </Text>
              <Text className="text-sm font-medium text-muted-foreground text-center leading-5 max-w-[260px]">
                {filter === 'all'
                  ? 'Захиалга хийх эсвэл мессеж хүлээн авах үед энд мэдэгдэл ирнэ.'
                  : filter === 'booking'
                    ? 'Захиалгатай холбоотой мэдэгдэл байхгүй.'
                    : 'Уншаагүй мессеж байхгүй.'
                }
              </Text>
              <TouchableOpacity
                className="mt-8 bg-primary px-8 py-3.5 rounded-2xl"
                onPress={() => onNavigate('home')}
                activeOpacity={0.8}
              >
                <Text className="text-white font-black text-sm">НҮҮР ХУУДАС</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredNotifs.map(item => (
              <NotificationCard
                key={item.id}
                item={item}
                onPress={() => handleNotifPress(item)}
              />
            ))
          )}

          {/* Status Legend */}
          {filteredNotifs.some(n => n.type === 'booking') && (
            <View className="mx-5 mt-6 bg-card border border-border rounded-[24px] p-5">
              <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px] mb-4">
                Захиалгын төлөв тайлбар
              </Text>
              <View className="gap-3">
                {Object.entries(STATUS_MAP).slice(0, 5).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <View key={key} className="flex-row items-center gap-3">
                      <View className={cn('w-8 h-8 rounded-lg items-center justify-center', cfg.bg)}>
                        <Icon size={14} className={cfg.color} />
                      </View>
                      <Text className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
